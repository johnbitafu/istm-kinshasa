import React, { useState, useEffect } from 'react';
import { Play, FileText, Image, Eye, Heart, MessageCircle, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContentItem {
  id: string;
  type: 'video' | 'article' | 'document' | 'image' | 'communique' | 'annonce' | 'actualite';
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

interface FeaturedContentSectionProps {
  setActiveSection: (section: string) => void;
}

const FeaturedContentSection: React.FC<FeaturedContentSectionProps> = ({ setActiveSection }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || contentItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % contentItems.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [contentItems.length, isAutoPlaying]);

  const loadFeaturedContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Chargement du contenu vedette depuis Firebase pour la page d\'accueil...');

      const contentRef = collection(db, 'content_items');
      const q = query(contentRef, orderBy('created_at', 'desc'), limit(6));
      const snapshot = await getDocs(q);

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

      if (items.length > 0) {
        setContentItems(items);
        console.log(`✅ ${items.length} élément(s) de contenu chargé(s) pour le carrousel`);
      } else {
        console.log('📭 Aucun contenu disponible pour le carrousel');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors du chargement du contenu vedette:', err);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Vidéo';
      case 'image': return 'Image';
      case 'article': return 'Article';
      case 'communique': return 'Communiqué';
      case 'annonce': return 'Annonce';
      case 'actualite': return 'Actualité';
      default: return 'Contenu';
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? contentItems.length - 1 : prev - 1);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % contentItems.length);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du contenu...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || contentItems.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contenu Éducatif
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Découvrez nos ressources pédagogiques
            </p>
            <div className="bg-gray-50 rounded-xl p-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-4">
                {error ? 'Erreur de chargement du contenu' : 'Aucun contenu disponible pour le moment'}
              </p>
              <button
                onClick={() => setActiveSection('contenu')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Voir la section contenu
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentItem = contentItems[currentIndex];
  const ContentIcon = getContentIcon(currentItem.type);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Contenu Éducatif
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos dernières ressources pédagogiques pour enrichir votre apprentissage
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Main Content */}
          <div className="relative h-96 md:h-[500px]">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0">
              {currentItem.type === 'image' ? (
                <img 
                  src={currentItem.thumbnail || currentItem.url}
                  alt={currentItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-green-600"></div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-4xl mx-auto px-8 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Text Content */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-full">
                        <ContentIcon className="h-6 w-6" />
                      </div>
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                        {getContentTypeLabel(currentItem.type)}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                      {currentItem.title}
                    </h3>
                    
                    <div 
                      className="text-lg opacity-90 line-clamp-3"
                      dangerouslySetInnerHTML={{ 
                        __html: currentItem.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                      }}
                    />
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        {currentItem.views} vues
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        {currentItem.likes} j'aime
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {currentItem.comments.length} commentaires
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setActiveSection('contenu')}
                        className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <span>Voir le contenu</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <span className="text-sm opacity-75">
                        Par {currentItem.author} • {new Date(currentItem.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Visual Element */}
                  <div className="hidden lg:block">
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                      <div className="aspect-video bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <ContentIcon className="h-16 w-16 opacity-60" />
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-3 bg-white bg-opacity-20 rounded"></div>
                        <div className="h-3 bg-white bg-opacity-20 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {contentItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 z-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 z-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Slide Indicators */}
          {contentItems.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {contentItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Auto-play indicator */}
          {isAutoPlaying && contentItems.length > 1 && (
            <div className="absolute top-4 right-4 z-20">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Auto</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Articles Éducatifs</h4>
              <p className="text-gray-600 text-sm">Ressources pédagogiques détaillées</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Vidéos Pratiques</h4>
              <p className="text-gray-600 text-sm">Démonstrations et tutoriels</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Supports Visuels</h4>
              <p className="text-gray-600 text-sm">Schémas et illustrations</p>
            </div>
          </div>
          
          <button
            onClick={() => setActiveSection('contenu')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105 shadow-lg"
          >
            Découvrir tout le contenu éducatif
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedContentSection;