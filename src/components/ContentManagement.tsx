import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Edit, Trash2, Eye, Image, Video, FileText, Calendar, User, Heart, MessageCircle } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'article' | 'document' | 'communique' | 'annonce' | 'actualite';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  author: string;
  date: string;
  likes: number;
  views: number;
  comments: any[];
}

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

  // Configuration de l'éditeur Quill
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
      console.log('📸 Chargement du contenu depuis Firebase...');

      const contentRef = collection(db, 'content_items');
      const snapshot = await getDocs(contentRef);

      const items: ContentItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'article',
          title: data.title || '',
          description: data.description || '',
          url: data.url || '',
          thumbnail: data.thumbnail || '',
          author: data.author || 'Anonyme',
          date: data.date || new Date().toISOString().split('T')[0],
          likes: data.likes || 0,
          views: data.views || 0,
          comments: data.comments || []
        };
      });
      setContentItems(items);
      console.log(`✅ ${items.length} élément(s) de contenu chargé(s)`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du contenu:', error);
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
      case 'article': return FileText;
      case 'communique': return FileText;
      case 'annonce': return FileText;
      case 'actualite': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'communique': return 'bg-yellow-100 text-yellow-800';
      case 'annonce': return 'bg-purple-100 text-purple-800';
      case 'actualite': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!newContentData.title || !newContentData.description || !newContentData.url) {
        setSubmitError('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }

      if (editingContent) {
        console.log('📝 Modification du contenu...');
        const contentRef = doc(db, 'content_items', editingContent.id);

        await updateDoc(contentRef, {
          type: newContentData.type,
          title: newContentData.title,
          description: newContentData.description,
          url: newContentData.url,
          thumbnail: newContentData.thumbnail,
          author: newContentData.author || editingContent.author,
          updated_at: Timestamp.now()
        });
        
        // Recharger la liste des contenus
        await loadContentItems();
        
        console.log('✅ Contenu modifié avec succès');
      } else {
        console.log('📸 Création d\'un nouveau contenu...');
        const contentRef = collection(db, 'content_items');

        await addDoc(contentRef, {
          type: newContentData.type,
          title: newContentData.title,
          description: newContentData.description,
          url: newContentData.url,
          thumbnail: newContentData.thumbnail,
          author: newContentData.author || 'Administrateur',
          date: new Date().toISOString().split('T')[0],
          likes: 0,
          views: 0,
          comments: [],
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });

        await loadContentItems();
        console.log('✅ Contenu créé avec succès');
      }

      // Réinitialiser le formulaire
      setNewContentData({
        type: 'article',
        title: '',
        description: '',
        url: '',
        thumbnail: '',
        author: ''
      });
      setEditingContent(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'opération:', error);
      setSubmitError(editingContent ? 'Erreur lors de la modification du contenu' : 'Erreur lors de la création du contenu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingContent(item);
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
      console.log('🗑️ Suppression du contenu...', item.title);
      const contentRef = doc(db, 'content_items', item.id);
      await deleteDoc(contentRef);

      setContentItems(prev => prev.filter(content => content.id !== item.id));

      if (selectedContent?.id === item.id) {
        setSelectedContent(null);
      }

      console.log('✅ Contenu supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
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

      {/* Liste du contenu */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistiques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentItems.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
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
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {item.description}
                            </div>
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
                            {item.comments.length}
                          </span>
                        </div>
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

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingContent ? 'Modifier le Contenu' : 'Créer un Nouveau Contenu'}
                </h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setSubmitError('');
                    setEditingContent(null);
                    setNewContentData({
                      type: 'article',
                      title: '',
                      description: '',
                      url: '',
                      thumbnail: '',
                      author: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleCreateContent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de contenu
                  </label>
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
                        onClick={() => {
                          setShowAddContentType(false);
                          setNewContentType('');
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
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

                {/* Ancien textarea en commentaire pour référence
                <textarea
                    value={newContentData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    placeholder="Description détaillée du contenu"
                    required
                />
                */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du contenu *
                  </label>
                  <input
                    type="url"
                    value={newContentData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://exemple.com/image.jpg ou lien vers l'article"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Pour les images: URL directe vers l'image. Pour les vidéos: lien YouTube/Vimeo. Pour les articles: lien vers l'article.
                  </p>
                </div>

                {newContentData.type === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miniature (optionnel)
                    </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auteur
                  </label>
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
                    onClick={() => {
                      setShowCreateModal(false);
                      setSubmitError('');
                      setEditingContent(null);
                      setNewContentData({
                        type: 'article',
                        title: '',
                        description: '',
                        url: '',
                        thumbnail: '',
                        author: ''
                      });
                    }}
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
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{editingContent ? 'Modification...' : 'Création...'}</span>
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

      {/* Modal de détails */}
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
                  <p className="text-gray-600 mb-4">{selectedContent.description}</p>
                  
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
                    <div className="text-2xl font-bold text-green-600">{selectedContent.comments.length}</div>
                    <div className="text-sm text-gray-600">Commentaires</div>
                  </div>
                </div>

                {selectedContent.comments.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Commentaires récents</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedContent.comments.slice(0, 5).map((comment) => (
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