import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, CreditCard as Edit, Trash2, Eye, Image, Video, FileText, Calendar, User, Heart, MessageCircle, Upload, X, Link, Pin, PinOff, GripVertical, ImagePlus } from 'lucide-react';
import { supabase, createContentItem, updateContentItem, deleteContentItem } from '../lib/supabase';
import type { ContentItem } from '../lib/supabase';

interface ContentType {
  id: string;
  value: string;
  label: string;
  is_base: boolean;
}

interface ImageEntry {
  id: string;
  src: string;
  file?: File;
  uploading?: boolean;
  uploaded?: boolean;
}

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

const ContentManagement: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    type: 'article',
    title: '',
    description: '',
    author: ''
  });
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [newContentType, setNewContentType] = useState('');
  const [showAddContentType, setShowAddContentType] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadContentTypes = async () => {
    const { data } = await supabase
      .from('content_types')
      .select('*')
      .order('is_base', { ascending: false })
      .order('label', { ascending: true });
    if (data) setContentTypes(data as ContentType[]);
  };

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentItems();
    loadContentTypes();
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

  const getTypeLabel = (typeValue: string) => {
    const found = contentTypes.find(t => t.value === typeValue);
    return found ? found.label : typeValue.charAt(0).toUpperCase() + typeValue.slice(1);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from('content-images').upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('content-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const addFilesToImages = useCallback((files: FileList | File[]) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type)) return;
      if (file.size > 10 * 1024 * 1024) return;
      const id = `local-${Date.now()}-${Math.random()}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { id, src: reader.result as string, file, uploading: false, uploaded: false }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFilesToImages(e.target.files);
    e.target.value = '';
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) addFilesToImages(e.dataTransfer.files);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const id = `url-${Date.now()}-${Math.random()}`;
    setImages(prev => [...prev, { id, src: url, uploaded: true }]);
    setUrlInput('');
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (id: string, direction: -1 | 1) => {
    setImages(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!formData.title || !formData.description) {
        setSubmitError('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }
      if (images.length === 0) {
        setSubmitError('Veuillez ajouter au moins une image');
        setIsSubmitting(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (const img of images) {
        if (img.file && !img.uploaded) {
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i));
          const url = await uploadFile(img.file);
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false, uploaded: true, src: url } : i));
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(img.src);
        }
      }

      const firstUrl = uploadedUrls[0];
      const payload = {
        type: formData.type as any,
        title: formData.title,
        description: formData.description,
        url: firstUrl,
        thumbnail: firstUrl,
        images: uploadedUrls,
        author: formData.author || (editingContent?.author ?? 'Administrateur'),
      };

      if (editingContent) {
        await updateContentItem(editingContent.id, payload);
      } else {
        await createContentItem(payload);
      }

      await loadContentItems();
      resetModal();
    } catch (err) {
      console.error(err);
      setSubmitError('Erreur lors de l\'enregistrement du contenu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setSubmitError('');
    setEditingContent(null);
    setImages([]);
    setUrlInput('');
    setFormData({ type: 'article', title: '', description: '', author: '' });
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingContent(item);
    const existing: ImageEntry[] = [];
    const imgs = item.images && item.images.length > 0 ? item.images : (item.thumbnail || item.url ? [item.thumbnail || item.url] : []);
    imgs.forEach((src, i) => {
      existing.push({ id: `existing-${i}`, src, uploaded: true });
    });
    setImages(existing);
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description,
      author: item.author
    });
    setShowCreateModal(true);
  };

  const handleDeleteContent = async (item: ContentItem) => {
    if (!confirm(`Supprimer "${item.title}" ? Cette action est irréversible.`)) return;
    try {
      await deleteContentItem(item.id);
      setContentItems(prev => prev.filter(c => c.id !== item.id));
      if (selectedContent?.id === item.id) setSelectedContent(null);
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddCustomContentType = async () => {
    const trimmed = newContentType.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/\s+/g, '_');
    const label = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const { error } = await supabase.from('content_types').insert({ value: slug, label, is_base: false });
    if (!error) {
      await loadContentTypes();
      setNewContentType('');
      setShowAddContentType(false);
    } else {
      alert('Ce type existe déjà ou une erreur est survenue.');
    }
  };

  const handleDeleteContentType = async (type: ContentType) => {
    if (type.is_base) return;
    if (!confirm(`Supprimer le type "${type.label}" ?`)) return;
    await supabase.from('content_types').delete().eq('id', type.id);
    await loadContentTypes();
  };

  const handleToggleFeatured = async (item: ContentItem) => {
    try {
      const newFeatured = !(item as any).is_featured;
      let newOrder = (item as any).featured_order || 0;
      if (newFeatured) {
        const featuredItems = contentItems.filter(i => (i as any).is_featured && i.id !== item.id);
        newOrder = featuredItems.length > 0 ? Math.max(...featuredItems.map(i => (i as any).featured_order || 0)) + 1 : 0;
      }
      const { error } = await supabase.from('content_items')
        .update({ is_featured: newFeatured, featured_order: newFeatured ? newOrder : 0, updated_at: new Date().toISOString() })
        .eq('id', item.id);
      if (error) throw error;
      setContentItems(prev => {
        const updated = prev.map(i => i.id === item.id ? { ...i, is_featured: newFeatured, featured_order: newFeatured ? newOrder : 0 } : i);
        updated.sort((a, b) => {
          const af = (a as any).is_featured, bf = (b as any).is_featured;
          if (af && !bf) return -1; if (!af && bf) return 1;
          if (af && bf) return ((a as any).featured_order || 0) - ((b as any).featured_order || 0);
          return 0;
        });
        return updated;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getFirstImage = (item: ContentItem) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return item.thumbnail || item.url;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion du Contenu Éducatif</h2>
          <p className="text-gray-600 mt-1">{contentItems.length} élément(s) de contenu</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Contenu</span>
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucun contenu créé</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En avant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentItems.map((item) => {
                  const isFeatured = (item as any).is_featured;
                  const TypeIcon = getTypeIcon(item.type);
                  const imgSrc = getFirstImage(item);
                  const photoCount = (item.images?.length || 0) > 1 ? item.images!.length : 0;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isFeatured ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-16 relative">
                            {imgSrc ? (
                              <img src={imgSrc} alt={item.title} className="h-12 w-16 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="h-12 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <TypeIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            {photoCount > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {photoCount}
                              </span>
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
                                  #{((item as any).featured_order || 0) + 1}
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
                          {getTypeLabel(item.type)}
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
                          <span className="flex items-center"><Heart className="h-4 w-4 mr-1 text-red-400" />{item.likes}</span>
                          <span className="flex items-center"><Eye className="h-4 w-4 mr-1 text-blue-400" />{item.views}</span>
                          <span className="flex items-center"><MessageCircle className="h-4 w-4 mr-1 text-green-400" />{(item.comments || []).length}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isFeatured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {isFeatured ? <><PinOff className="h-3.5 w-3.5" />Retirer</> : <><Pin className="h-3.5 w-3.5" />Épingler</>}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setSelectedContent(item)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="Voir"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => handleEditContent(item)} className="text-green-600 hover:text-green-900 p-1 rounded" title="Modifier"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteContent(item)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
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

      {/* Types Manager */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Types de contenu</h3>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les types disponibles lors de la création de contenu</p>
          </div>
          <button onClick={() => setShowAddContentType(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Ajouter un type
          </button>
        </div>
        {showAddContentType && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="text"
              value={newContentType}
              onChange={(e) => setNewContentType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomContentType()}
              placeholder="Nom du nouveau type (ex: Conférence)"
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleAddCustomContentType} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">Ajouter</button>
            <button onClick={() => { setShowAddContentType(false); setNewContentType(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 font-medium">Annuler</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {contentTypes.map(type => (
            <div key={type.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getTypeColor(type.value)}`}>
              <span>{type.label}</span>
              {!type.is_base && (
                <button onClick={() => handleDeleteContentType(type)} className="ml-1 hover:text-red-600 transition-colors" title={`Supprimer "${type.label}"`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingContent ? 'Modifier le Contenu' : 'Créer un Nouveau Contenu'}
                </h2>
                <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-6 w-6" /></button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de contenu</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {contentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
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
                      value={formData.description}
                      onChange={(value) => setFormData(p => ({ ...p, description: value }))}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Description détaillée..."
                      style={{ minHeight: '180px' }}
                    />
                  </div>
                </div>

                {/* Multi-image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos *
                    <span className="ml-2 text-xs text-gray-400 font-normal">({images.length} photo{images.length !== 1 ? 's' : ''}) — la 1re sera l'image principale</span>
                  </label>

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDropZoneDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                  >
                    <ImagePlus className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Glissez-déposez vos photos ici</p>
                    <p className="text-xs text-gray-500 mt-1">ou cliquez pour choisir — JPG, PNG, GIF, WebP — max 10 MB chacune</p>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilePick} className="hidden" />
                  </div>

                  {/* URL Input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                      placeholder="Ou coller une URL d'image..."
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim()}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Link className="h-4 w-4" />
                      Ajouter
                    </button>
                  </div>

                  {/* Image Grid */}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                          <img
                            src={img.src}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Erreur</text></svg>'; }}
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-semibold">Principal</span>
                          )}
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => { e.stopPropagation(); moveImage(img.id, -1); }}
                                className="flex-1 bg-white/80 hover:bg-white text-gray-700 rounded text-xs py-0.5 disabled:opacity-30"
                              >
                                &larr;
                              </button>
                              <button
                                type="button"
                                disabled={idx === images.length - 1}
                                onClick={(e) => { e.stopPropagation(); moveImage(img.id, 1); }}
                                className="flex-1 bg-white/80 hover:bg-white text-gray-700 rounded text-xs py-0.5 disabled:opacity-30"
                              >
                                &rarr;
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add More Button */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all"
                      >
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Ajouter</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(p => ({ ...p, author: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de l'auteur (par défaut: Administrateur)"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Enregistrement...
                      </span>
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

      {/* Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du Contenu</h2>
                <button onClick={() => setSelectedContent(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-6 w-6" /></button>
              </div>
              <div className="space-y-6">
                {/* Images Gallery */}
                {(() => {
                  const allImgs = selectedContent.images && selectedContent.images.length > 0
                    ? selectedContent.images
                    : (selectedContent.thumbnail || selectedContent.url ? [selectedContent.thumbnail || selectedContent.url] : []);
                  return allImgs.length > 0 ? (
                    <div className={`grid gap-2 ${allImgs.length === 1 ? 'grid-cols-1' : allImgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {allImgs.map((src, i) => (
                        <img key={i} src={src} alt={`Photo ${i + 1}`} className="w-full h-40 object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ))}
                    </div>
                  ) : null;
                })()}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{selectedContent.title}</h3>
                  <div className="text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: selectedContent.description }} />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Type:</strong> {getTypeLabel(selectedContent.type)}</div>
                    <div><strong>Auteur:</strong> {selectedContent.author}</div>
                    <div><strong>Date:</strong> {new Date(selectedContent.date).toLocaleDateString('fr-FR')}</div>
                    <div><strong>Photos:</strong> {(selectedContent.images?.length || 0) || 1}</div>
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
                    <div className="space-y-3 max-h-48 overflow-y-auto">
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
                <button onClick={() => setSelectedContent(null)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
