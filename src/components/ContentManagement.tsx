import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, CreditCard as Edit, Trash2, Eye, Image, Video, FileText, Calendar, User, Heart, MessageCircle, Upload, X, Link, Pin, PinOff } from 'lucide-react';
import { supabase, createContentItem, updateContentItem, deleteContentItem, getContentItems } from '../lib/supabase';
import type { ContentItem } from '../lib/supabase';

const ContentManagement: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [newContentData, setNewContentData] = useState({
    type: 'article' as 'image' | 'video' | 'article' | 'communique' | 'annonce' | 'actualite',
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    author: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customContentTypes, setCustomContentTypes] = useState<string[]>([]);
  const [newContentType, setNewContentType] = useState('');
  const [showAddContentType, setShowAddContentType] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'align', 'code-block'
  ];

  const loadContentItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = (data || []) as any[];
      items.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.is_featured && b.is_featured) return (a.featured_order || 0) - (b.featured_order || 0);
        return 0;
      });

      setContentItems(items as ContentItem[]);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentItems();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'communique': return 'bg-yellow-100 text-yellow-800';
      case 'annonce': return 'bg-orange-100 text-orange-800';
      case 'actualite': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Seules les images sont acceptées (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('L\'image ne doit pas dépasser 10 MB');
      return;
    }

    setSelectedFile(file);
    setSubmitError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(10);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    setUploadProgress(40);

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    setUploadProgress(80);

    const { data } = supabase.storage
      .from('content-images')
      .getPublicUrl(filePath);

    setUploadProgress(100);
    setIsUploading(false);

    return data.publicUrl;
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!newContentData.title || !newContentData.description) {
        setSubmitError('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }

      if (uploadMode === 'file' && !selectedFile && !newContentData.url) {
        setSubmitError('Veuillez sélectionner une image à télécharger');
        setIsSubmitting(false);
        return;
      }

      if (uploadMode === 'url' && !newContentData.url) {
        setSubmitError('Veuillez saisir une URL');
        setIsSubmitting(false);
        return;
      }

      let finalUrl = newContentData.url;

      if (uploadMode === 'file' && selectedFile) {
        finalUrl = await uploadImageToSupabase(selectedFile);
        handleInputChange('url', finalUrl);
      }

      if (editingContent) {
        await updateContentItem(editingContent.id, {
          type: newContentData.type,
          title: newContentData.title,
          description: newContentData.description,
          url: finalUrl,
          thumbnail: newContentData.thumbnail,
          author: newContentData.author || editingContent.author,
        });
      } else {
        await createContentItem({
          type: newContentData.type,
          title: newContentData.title,
          description: newContentData.description,
          url: finalUrl,
          thumbnail: newContentData.thumbnail,
          author: newContentData.author || 'Administrateur',
        });
      }

      await loadContentItems();

      setNewContentData({
        type: 'article',
        title: '',
        description: '',
        url: '',
        thumbnail: '',
        author: ''
      });
      setSelectedFile(null);
      setFilePreview(null);
      setUploadMode('url');
      setUploadProgress(0);
      setEditingContent(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setSubmitError(editingContent ? 'Erreur lors de la modification du contenu' : 'Erreur lors de la création du contenu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setSubmitError('');
    setEditingContent(null);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadMode('url');
    setUploadProgress(0);
    setNewContentData({
      type: 'article',
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      author: ''
    });
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingContent(item);
    setSelectedFile(null);
    setFilePreview(item.url && (item.type === 'image') ? item.url : null);
    setUploadMode(item.url && item.url.includes('supabase') ? 'file' : 'url');
    setNewContentData({
      type: item.type as any,
      title: item.title,
      description: item.description,
      url: item.url,
      thumbnail: item.thumbnail || '',
      author: item.author
    });
    setShowCreateModal(true);
  };

  const handleDeleteContent = async (item: ContentItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteContentItem(item.id);
      setContentItems(prev => prev.filter(content => content.id !== item.id));
      if (selectedContent?.id === item.id) {
        setSelectedContent(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du contenu');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewContentData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCustomContentType = () => {
    if (newContentType.trim() && !customContentTypes.includes(newContentType.trim().toLowerCase())) {
      setCustomContentTypes(prev => [...prev, newContentType.trim().toLowerCase()]);
      setNewContentType('');
      setShowAddContentType(false);
    }
  };

  const handleToggleFeatured = async (item: ContentItem) => {
    try {
      const newFeatured = !(item as any).is_featured;
      let newOrder = (item as any).featured_order || 0;

      if (newFeatured) {
        const featuredItems = contentItems.filter(i => (i as any).is_featured && i.id !== item.id);
        newOrder = featuredItems.length > 0
          ? Math.max(...featuredItems.map(i => (i as any).featured_order || 0)) + 1
          : 0;
      }

      const { error } = await supabase
        .from('content_items')
        .update({
          is_featured: newFeatured,
          featured_order: newFeatured ? newOrder : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      setContentItems(prev => {
        const updated = prev.map(i =>
          i.id === item.id ? { ...i, is_featured: newFeatured, featured_order: newFeatured ? newOrder : 0 } : i
        );
        updated.sort((a, b) => {
          const aFeatured = (a as any).is_featured;
          const bFeatured = (b as any).is_featured;
          if (aFeatured && !bFeatured) return -1;
          if (!aFeatured && bFeatured) return 1;
          if (aFeatured && bFeatured) return ((a as any).featured_order || 0) - ((b as any).featured_order || 0);
          return 0;
        });
        return updated;
      });
    } catch (error) {
      console.error('Erreur lors de la mise en avant:', error);
    }
  };

  const getAllContentTypes = () => {
    const baseTypes = [
      { value: 'article', label: 'Article' },
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Vidéo' },
      { value: 'communique', label: 'Communiqué' },
      { value: 'annonce', label: 'Annonce' },
      { value: 'actualite', label: 'Actualité' }
    ];

    const customTypes = customContentTypes.map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    return [...baseTypes, ...customTypes];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion du Contenu Éducatif</h2>
          <p className="text-gray-600 mt-1">
            {contentItems.length} élément(s) de contenu
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Contenu</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucun contenu créé</p>
            <p className="text-gray-400 text-sm mt-2">
              Commencez par créer votre premier élément de contenu éducatif
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistiques</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En avant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentItems.map((item) => {
                  const isFeatured = (item as any).is_featured;
                  const featuredOrder = (item as any).featured_order;
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isFeatured ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            {item.type === 'image' ? (
                              <img
                                src={item.thumbnail || item.url}
                                alt={item.title}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <TypeIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                            {isFeatured && (
                              <span className="absolute -top-1 -right-1 bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center">
                                <Pin className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1 flex items-center gap-1.5">
                              {isFeatured && (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                  #{(featuredOrder || 0) + 1}
                                </span>
                              )}
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1" dangerouslySetInnerHTML={{ __html: item.description.replace(/<[^>]*>/g, '').substring(0, 80) }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {item.author}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1 text-red-400" />
                            {item.likes}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1 text-blue-400" />
                            {item.views}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1 text-green-400" />
                            {(item.comments || []).length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isFeatured
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={isFeatured ? 'Retirer du carrousel' : 'Mettre en avant dans le carrousel'}
                        >
                          {isFeatured ? (
                            <><PinOff className="h-3.5 w-3.5" />Retirer</>
                          ) : (
                            <><Pin className="h-3.5 w-3.5" />Épingler</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedContent(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditContent(item)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingContent ? 'Modifier le Contenu' : 'Créer un Nouveau Contenu'}
                </h2>
                <button onClick={resetModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleCreateContent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de contenu</label>
                  <div className="flex space-x-2">
                    <select
                      value={newContentData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {getAllContentTypes().map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddContentType(!showAddContentType)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                      title="Ajouter un nouveau type"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {showAddContentType && (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        value={newContentType}
                        onChange={(e) => setNewContentType(e.target.value)}
                        placeholder="Nouveau type (ex: événement)"
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomContentType}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddContentType(false); setNewContentType(''); }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input
                    type="text"
                    value={newContentData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre du contenu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <div className="border border-gray-300 rounded-lg">
                    <ReactQuill
                      theme="snow"
                      value={newContentData.description}
                      onChange={(value) => handleInputChange('description', value)}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Description détaillée du contenu avec mise en forme..."
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Utilisez la barre d'outils pour mettre en forme votre texte (gras, italique, couleurs, listes, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image / Média *</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
                    <button
                      type="button"
                      onClick={() => { setUploadMode('file'); setNewContentData(p => ({ ...p, url: '' })); setFilePreview(null); setSelectedFile(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${uploadMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Upload className="h-4 w-4" />
                      Télécharger une image
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUploadMode('url'); setSelectedFile(null); setFilePreview(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${uploadMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Link className="h-4 w-4" />
                      Utiliser une URL
                    </button>
                  </div>

                  {uploadMode === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {!selectedFile && !filePreview ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">Cliquez pour sélectionner une image</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP — max 10 MB</p>
                        </div>
                      ) : (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={filePreview || newContentData.url}
                            alt="Aperçu"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                          {selectedFile && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 flex items-center justify-between">
                              <span className="truncate">{selectedFile.name}</span>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="ml-2 underline flex-shrink-0"
                              >
                                Changer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {isUploading && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Téléchargement en cours...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={newContentData.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://exemple.com/image.jpg ou lien YouTube/Vimeo"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Images: URL directe. Vidéos: lien YouTube ou Vimeo. Articles: lien vers la page.
                      </p>
                    </div>
                  )}
                </div>

                {newContentData.type === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Miniature (optionnel)</label>
                    <input
                      type="url"
                      value={newContentData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://exemple.com/miniature.jpg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
                  <input
                    type="text"
                    value={newContentData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de l'auteur (par défaut: Administrateur)"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={isSubmitting || isUploading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting || isUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{isUploading ? 'Téléchargement...' : editingContent ? 'Modification...' : 'Création...'}</span>
                      </div>
                    ) : (
                      editingContent ? 'Modifier le contenu' : 'Créer le contenu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du Contenu</h2>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{selectedContent.title}</h3>
                  <div className="text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: selectedContent.description }} />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Type:</strong> {selectedContent.type}</div>
                    <div><strong>Auteur:</strong> {selectedContent.author}</div>
                    <div><strong>Date:</strong> {new Date(selectedContent.date).toLocaleDateString('fr-FR')}</div>
                    <div><strong>URL:</strong> <a href={selectedContent.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voir le contenu</a></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{selectedContent.likes}</div>
                    <div className="text-sm text-gray-600">J'aime</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{selectedContent.views}</div>
                    <div className="text-sm text-gray-600">Vues</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{(selectedContent.comments || []).length}</div>
                    <div className="text-sm text-gray-600">Commentaires</div>
                  </div>
                </div>

                {(selectedContent.comments || []).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Commentaires récents</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(selectedContent.comments || []).slice(0, 5).map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900">{comment.author}</span>
                            <span className="text-sm text-gray-500">{new Date(comment.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedContent(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
