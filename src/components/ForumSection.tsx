import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, ThumbsUp, Clock, User, Filter } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthGuard';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  replies: Reply[];
  likes: number;
  views: number;
  isAnswered: boolean;
}

interface Reply {
  id: string;
  author: string;
  content: string;
  date: string;
  isAnswer: boolean;
}

const ForumSection: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const POSTS_PER_PAGE = 10;
  
  const [newPostData, setNewPostData] = useState({
    title: '',
    category: 'general',
    content: ''
  });

  const { user, isStudent } = useAuth();

  const categories = [
    { id: 'all', label: 'Toutes les catégories' },
    { id: 'general', label: 'Général' },
    { id: 'anatomie', label: 'Anatomie' },
    { id: 'pharmacologie', label: 'Pharmacologie' },
    { id: 'clinique', label: 'Pratique Clinique' },
    { id: 'stages', label: 'Stages' }
  ];

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([
    {
      id: '1',
      title: 'Question sur l\'administration des médicaments par voie IV',
      content: 'Bonjour, j\'aimerais avoir des clarifications sur les bonnes pratiques pour l\'administration intraveineuse...',
      author: 'Marie K.',
      date: '2025-01-15',
      category: 'pharmacologie',
      replies: [
        {
          id: '1',
          author: 'Dr. Lumumba',
          content: 'Excellente question ! Voici les étapes essentielles...',
          date: '2025-01-15',
          isAnswer: true
        }
      ],
      likes: 12,
      views: 45,
      isAnswered: true
    },
    {
      id: '2',
      title: 'Préparation aux examens d\'anatomie',
      content: 'Quelles sont vos techniques d\'étude pour mémoriser l\'anatomie ?',
      author: 'Jean P.',
      date: '2025-01-14',
      category: 'anatomie',
      replies: [],
      likes: 8,
      views: 32,
      isAnswered: false
    }
  ]);

  const filteredPosts = activeCategory === 'all' 
    ? forumPosts 
    : forumPosts.filter(post => post.category === activeCategory);

  const loadForumPosts = async () => {
    try {
      setLoading(true);
      console.log('💬 Chargement des posts du forum depuis Firebase...');

      const forumRef = collection(db, 'forum_posts');
      const snapshot = await getDocs(forumRef);

      const posts: ForumPost[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          author: data.author || 'Anonyme',
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'general',
          replies: data.replies || [],
          likes: data.likes || 0,
          views: data.views || 0,
          isAnswered: data.isAnswered || false
        };
      });

      setForumPosts(posts);
      console.log(`✅ ${posts.length} post(s) chargé(s)`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForumPosts();
  }, []);

  const handleAddReply = async (postId: string) => {
    if (newReply.trim() && selectedPost) {
      if (!user || !isStudent()) {
        alert('Vous devez être connecté en tant qu\'étudiant pour répondre');
        return;
      }

      try {
        const postRef = doc(db, 'forum_posts', postId);
        const reply: Reply = {
          id: Date.now().toString(),
          author: `${user.name} (${user.matricule})`,
          content: newReply,
          date: new Date().toISOString(),
          isAnswer: false
        };

        const updatedReplies = [...(selectedPost.replies || []), reply];
        await updateDoc(postRef, {
          replies: updatedReplies
        });

        await loadForumPosts();
        setNewReply('');
        console.log('✅ Réponse ajoutée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la réponse:', error);
        alert('Erreur lors de l\'ajout de la réponse');
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isStudent()) {
      alert('Vous devez être connecté en tant qu\'étudiant pour poser une question');
      return;
    }
    
    if (!newPostData.title.trim() || !newPostData.content.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      console.log('💬 Création d\'un nouveau post...');

      const forumRef = collection(db, 'forum_posts');
      const postData = {
        title: newPostData.title,
        content: newPostData.content,
        category: newPostData.category,
        author: `${user.name} (${user.matricule})`,
        date: new Date().toISOString().split('T')[0],
        replies: [],
        likes: 0,
        views: 0,
        isAnswered: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };

      await addDoc(forumRef, postData);

      await loadForumPosts();

      setNewPostData({
        title: '',
        category: 'general',
        content: ''
      });
      setShowNewPost(false);

      console.log('✅ Post créé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la création du post:', error);
      alert('Erreur lors de la création du post');
    }
  };

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Forum Étudiant
            </h2>
            <p className="text-xl text-gray-600">
              Posez vos questions et partagez vos connaissances
            </p>
          </div>
          
          <button 
            onClick={() => setShowNewPost(true)}
           disabled={!user || !isStudent()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
           <span>{user && isStudent() ? 'Nouvelle Question' : 'Connexion requise'}</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Forum Posts */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">
              {forumPosts.length === 0 ? 'Aucune question posée' : 'Aucune question trouvée dans cette catégorie'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {forumPosts.length === 0 
                ? 'Soyez le premier à poser une question !' 
                : 'Essayez de sélectionner une autre catégorie'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600">
                          {post.title}
                        </h3>
                        {post.isAnswered && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            Répondu
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {post.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(post.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {categories.find(cat => cat.id === post.category)?.label || post.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {post.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.replies.length}
                      </span>
                      <span>{post.views} vues</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bouton Charger Plus */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadForumPosts(true)}
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
                      <MessageCircle className="h-5 w-5" />
                      <span>Charger plus de discussions</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Post Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <p className="text-gray-700 leading-relaxed mb-4">{selectedPost.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Par {selectedPost.author} • {new Date(selectedPost.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold">Réponses ({selectedPost.replies.length})</h3>
                  {selectedPost.replies.map((reply) => (
                    <div 
                      key={reply.id} 
                      className={`p-4 rounded-lg ${reply.isAnswer ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{reply.author}</span>
                        <div className="flex items-center space-x-2">
                          {reply.isAnswer && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              Réponse acceptée
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(reply.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700">{reply.content}</p>
                    </div>
                  ))}
                  {selectedPost.replies.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune réponse pour le moment</p>
                  )}
                </div>

                {/* Add Reply */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">Ajouter une réponse</h4>
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder={user && isStudent() ? "Votre réponse..." : "Connectez-vous avec votre matricule pour répondre"}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={!user || !isStudent()}
                  />
                  <button 
                    onClick={() => handleAddReply(selectedPost.id)}
                    disabled={!user || !isStudent() || !newReply.trim()}
                    className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {user && isStudent() ? 'Publier la réponse' : 'Connexion requise'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Nouvelle Question</h2>
                  <button 
                    onClick={() => setShowNewPost(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de votre question
                    </label>
                    <input
                      type="text"
                      value={newPostData.title}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Comment effectuer une prise de tension artérielle ?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select 
                      value={newPostData.category}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.slice(1).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description détaillée
                    </label>
                    <textarea
                      value={newPostData.content}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                      placeholder="Décrivez votre question en détail..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => setShowNewPost(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Publier la question
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ForumSection;