import React, { useState, useEffect } from 'react';
import { Play, FileText, MessageCircle, Heart, Eye, Calendar, X, Send, ArrowLeft, Share2, Bookmark, Edit3 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthGuard';

interface Comment {
  id?: string;
  author: string;
  content: string;
  date: string;
}

interface ContentItem {
  id: string;
  type: 'video' | 'article' | 'document';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  author: string;
  date: string;
  likes: number;
  views: number;
  comments: Comment[];
}

interface ContentSectionProps {
  selectedContentId?: string | null;
}

const ContentSection: React.FC<ContentSectionProps> = ({ selectedContentId }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentTab, setCommentTab] = useState<'view' | 'write'>('view');

  const ITEMS_PER_PAGE = 9; // 3x3 grid

  const { user, isStudent } = useAuth();

  const loadContentItems = async (loadMore: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Chargement du contenu depuis Firebase...');

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
          thumbnail: data.thumbnail || null,
          author: data.author || 'Anonyme',
          date: data.date || new Date().toISOString().split('T')[0],
          likes: data.likes || 0,
          views: data.views || 0,
          comments: data.comments || []
        };
      });

      setContentItems(items);
      console.log(`✅ ${items.length} élément(s) de contenu chargé(s)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors du chargement du contenu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentItems();
  }, []);

  useEffect(() => {
    if (selectedContentId && contentItems.length > 0) {
      const content = contentItems.find(item => item.id === selectedContentId);
      if (content) {
        setSelectedContent(content);
      }
    }
  }, [selectedContentId, contentItems]);

  const filterOptions = [
    { id: 'all', label: 'Tout' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Vidéos' },
    { id: 'article', label: 'Articles' }
  ];

  const filteredContent = activeFilter === 'all' 
    ? contentItems 
    : contentItems.filter(item => item.type === activeFilter);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return FileText;
      case 'communique': return FileText;
      case 'annonce': return FileText;
      case 'actualite': return FileText;
      default: return Eye;
    }
  };

  const handleAddComment = async (contentId: string) => {
    if (newComment.trim() && selectedContent) {
      if (!user || !isStudent()) {
        alert('Vous devez être connecté en tant qu\'étudiant pour commenter');
        return;
      }

      try {
        console.log('💬 Ajout d\'un commentaire...');

        const contentRef = doc(db, 'content_items', contentId);
        const comment: Comment = {
          author: `${user.name} (${user.matricule})`,
          content: newComment,
          date: new Date().toISOString()
        };

        const updatedComments = [...(selectedContent.comments || []), comment];
        await updateDoc(contentRef, {
          comments: updatedComments
        });

        setSelectedContent({ ...selectedContent, comments: updatedComments });

        // Recharger le contenu pour obtenir les derniers commentaires
        await loadContentItems();
        console.log('✅ Commentaire ajouté avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du commentaire:', error);
        alert('Erreur lors de l\'ajout du commentaire');
      }
      
      setNewComment('');
    }
  };

  const handleLike = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();

    try {
      console.log('❤️ Ajout d\'un like...');
      const contentRef = doc(db, 'content_items', item.id);
      const newLikes = item.likes + 1;

      await updateDoc(contentRef, { likes: newLikes });

      setContentItems(prev => 
        prev.map(contentItem => 
          contentItem.id === item.id 
            ? { ...contentItem, likes: newLikes }
            : contentItem
        )
      );
      
      console.log('✅ Like ajouté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du like:', error);
    }
  };

  const handleViewContent = async (item: ContentItem) => {
    try {
      console.log('👁️ Incrémentation des vues...');
      const newViews = item.views + 1;
      
      await updateContentItem(item.id, { views: newViews });
      
      // Mettre à jour l'état local
      const updatedItem = { ...item, views: newViews };
      setContentItems(prev => 
        prev.map(contentItem => 
          contentItem.id === item.id 
            ? updatedItem
            : contentItem
        )
      );
      
      // Ouvrir le modal avec les données mises à jour
      setSelectedContent(updatedItem);
      
      console.log('✅ Vue ajoutée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la vue:', error);
      // Ouvrir le modal même en cas d'erreur
      setSelectedContent(item);
    }
  };
  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Actualités 
          </h2>
          <p className="text-xl text-gray-600">
            Laissez vous infomrer sur la vie quotidienne du campus ISTM-Kinshasa
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeFilter === option.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Erreur de chargement du contenu</p>
            </div>
            <p className="text-red-700 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucun contenu disponible</p>
            <p className="text-gray-400 text-sm mt-2">Le contenu éducatif apparaîtra ici une fois créé dans le back office</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredContent.map((item) => {
                const IconComponent = getContentIcon(item.type);
                return (
                  <div 
                    key={item.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                    onClick={() => handleViewContent(item)}
                  >
                    <div className="relative">
                      <img 
                        src={item.thumbnail || item.url}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 text-white p-2 rounded-full">
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <div 
                        className="text-gray-600 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{item.author}</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-gray-500">
                          <button 
                            onClick={(e) => handleLike(e, item)}
                            className="flex items-center hover:text-red-500 transition-colors duration-200 group"
                          >
                            <Heart className="h-4 w-4 mr-1 group-hover:fill-current" />
                            {item.likes}
                          </button>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {item.views}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {item.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bouton Charger Plus */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => loadContentItems(true)}
                  disabled={loadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      <span>Charger plus de contenu</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Content Detail Modal - Premium Design */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 overflow-y-auto p-4">
            <div className="min-h-screen flex items-start justify-center py-8">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">
                {/* En-tête avec gradient bleu-vert */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 md:p-6 text-center">
                  <h2 className="text-xl md:text-3xl font-bold">📰 Détail de l'Actualité</h2>
                </div>
                {/* Header avec image de fond */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                {/* Background Image - Affiche toujours l'image */}
                <div className="absolute inset-0">
                  <img
                    src={selectedContent.thumbnail || selectedContent.url}
                    alt={selectedContent.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-500"></div>';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                </div>

                  {/* Header Controls */}
                  <div className="absolute top-0 left-0 right-0 p-3 md:p-6 flex justify-between items-start z-10">
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-2 md:px-4 md:py-3 rounded-full transition-all duration-200 flex items-center space-x-2 shadow-lg text-sm md:text-base"
                    >
                      <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-semibold">Retour</span>
                    </button>

                    <button
                      onClick={() => setSelectedContent(null)}
                      className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600 text-white p-2 md:p-3 rounded-full transition-all duration-200 shadow-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white z-10">
                    <div className="max-w-4xl">
                      {/* Type Badge */}
                      <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                        <div className="bg-white/20 backdrop-blur-sm p-1.5 md:p-2 rounded-full">
                          {selectedContent.type === 'video' ? (
                            <Play className="h-4 w-4 md:h-5 md:w-5" />
                          ) : (
                            <FileText className="h-4 w-4 md:h-5 md:w-5" />
                          )}
                        </div>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium">
                          {selectedContent.type === 'video' ? 'Vidéo' : selectedContent.type === 'article' ? 'Article' : 'Document'}
                        </span>
                      </div>

                      {/* Title */}
                      <h1 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3 md:mb-4">
                        {selectedContent.title}
                      </h1>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden md:inline">{new Date(selectedContent.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                          <span className="md:hidden">{new Date(selectedContent.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <span className="hidden md:inline">Par {selectedContent.author}</span>
                        <div className="flex items-center space-x-2 md:space-x-4">
                          <span className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                            <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            {selectedContent.views}
                          </span>
                          <span className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                            <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            {selectedContent.likes}
                          </span>
                          <span className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                            <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            {selectedContent.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 md:p-8 lg:p-12">
                  <div className="max-w-4xl mx-auto">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200">
                      <div className="flex items-center space-x-2 md:space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(e, selectedContent);
                          }}
                          className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200 text-sm md:text-base"
                        >
                          <Heart className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="font-medium">{selectedContent.likes}</span>
                        </button>
                        <button className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 text-sm md:text-base">
                          <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="font-medium">{selectedContent.comments.length}</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Description */}
                    <div
                      className="prose prose-sm md:prose-lg max-w-none mb-8 md:mb-12 text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedContent.description }}
                    />

                    {/* Comments Section avec Onglets */}
                    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t-2 border-gray-200">
                      {/* Tabs Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 mr-2 text-blue-600" />
                          Commentaires ({selectedContent.comments.length})
                        </h3>

                        {/* Boutons d'onglets */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCommentTab('view')}
                            className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all duration-200 text-sm md:text-base ${
                              commentTab === 'view'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden md:inline">Voir</span>
                          </button>
                          <button
                            onClick={() => setCommentTab('write')}
                            className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all duration-200 text-sm md:text-base ${
                              commentTab === 'write'
                                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="hidden md:inline">Écrire</span>
                          </button>
                        </div>
                      </div>

                      {/* Tab Content - Voir les commentaires */}
                      {commentTab === 'view' && (
                        <div className="space-y-4">
                          {selectedContent.comments.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-gray-500 text-lg font-medium">Aucun commentaire pour le moment</p>
                              <p className="text-gray-400 text-sm mt-2">Soyez le premier à partager votre avis!</p>
                            </div>
                          ) : (
                            selectedContent.comments.map((comment, index) => (
                              <div
                                key={comment.id || index}
                                className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                                      {comment.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-900 block text-sm md:text-base">{comment.author}</span>
                                      <span className="text-xs md:text-sm text-gray-500">
                                        {new Date(comment.date).toLocaleDateString('fr-FR', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed pl-0 md:pl-13 text-sm md:text-base">{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Tab Content - Écrire un commentaire */}
                      {commentTab === 'write' && (
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 md:p-6 rounded-xl">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={user && isStudent() ? "Partagez votre avis..." : "Connectez-vous avec votre matricule pour commenter"}
                            className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white transition-all duration-200 text-sm md:text-base"
                            rows={4}
                            disabled={!user || !isStudent()}
                          />
                          <div className="flex flex-col md:flex-row justify-between md:items-center mt-4 space-y-3 md:space-y-0">
                            <p className="text-xs md:text-sm text-gray-600">
                              {!user || !isStudent() ? '🔒 Connexion requise pour commenter' : '💬 Soyez respectueux et constructif'}
                            </p>
                            <button
                              onClick={() => {
                                handleAddComment(selectedContent.id);
                                setCommentTab('view');
                              }}
                              disabled={!user || !isStudent() || !newComment.trim()}
                              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base"
                            >
                              <Send className="h-4 w-4" />
                              <span>{user && isStudent() ? 'Publier' : 'Connexion requise'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentSection;