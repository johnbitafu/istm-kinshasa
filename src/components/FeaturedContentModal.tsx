import React, { useState, useEffect } from 'react';
import { Play, FileText, Image, Eye, Heart, MessageCircle, ChevronLeft, ChevronRight, ArrowRight, X, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShareModal from './ShareModal';

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
  is_featured?: boolean;
  featured_order?: number;
}

interface FeaturedContentModalProps {
  onClose: () => void;
  setActiveSection: (section: string) => void;
  onSelectContent: (contentId: string) => void;
}

const FeaturedContentModal: React.FC<FeaturedContentModalProps> = ({ onClose, setActiveSection, onSelectContent }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [sharingItem, setSharingItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || contentItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % contentItems.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [contentItems.length, isAutoPlaying]);

  const loadFeaturedContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (fetchError) throw fetchError;

      const items: ContentItem[] = (data || []).map((row: any) => ({
        id: row.id,
        type: row.type || 'article',
        title: row.title || '',
        description: row.description || '',
        url: row.url || '',
        thumbnail: row.thumbnail || null,
        author: row.author || 'Anonyme',
        date: row.date || new Date().toISOString().split('T')[0],
        likes: row.likes || 0,
        views: row.views || 0,
        comments: row.comments || [],
        is_featured: row.is_featured || false,
        featured_order: row.featured_order || 0
      }));

      items.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.is_featured && b.is_featured) return (a.featured_order || 0) - (b.featured_order || 0);
        return 0;
      });

      setContentItems(items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors du chargement du contenu vedette:', err);
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
    // Resume auto-play after 8 seconds
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % contentItems.length);
    setIsAutoPlaying(false);
    // Resume auto-play after 8 seconds
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 8 seconds
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleViewContent = () => {
    setActiveSection('contenu');
    onClose();
  };

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des nouveautés...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || contentItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nouveautés à venir</h3>
            <p className="text-gray-600 mb-6">
              {error ? 'Erreur de chargement du contenu' : 'Aucun contenu disponible pour le moment'}
            </p>
            <button
              onClick={handleViewContent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Voir la section contenu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = contentItems[currentIndex];
  const ContentIcon = getContentIcon(currentItem.type);

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">🎉 Actualités et Nouveautés</h2>
          <p className="text-blue-100">Restez informé de tout ce qui se passe à l'ISTM Kinshasa</p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Content */}
          <div className="relative h-80 md:h-96">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0">
              {currentItem.type === 'image' ? (
                <img 
                  src={currentItem.thumbnail || currentItem.url}
                  alt={currentItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-500"></div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 h-full flex items-center p-6">
              <div className="w-full text-white">
                <div className="max-w-2xl">
                  {/* Content Type Badge */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-full">
                      <ContentIcon className="h-5 w-5" />
                    </div>
                    <span className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {getContentTypeLabel(currentItem.type)}
                    </span>
                    {isAutoPlaying && contentItems.length > 1 && (
                      <div className="bg-green-500 bg-opacity-80 backdrop-blur-sm px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <span>Auto</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                    {currentItem.title}
                  </h3>
                  
                  {/* Description */}
                  <div 
                    className="text-lg opacity-90 mb-6 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: currentItem.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                    }}
                  />
                  
                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm mb-6">
                    <span className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Eye className="h-4 w-4 mr-2" />
                      {currentItem.views}
                    </span>
                    <span className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Heart className="h-4 w-4 mr-2" />
                      {currentItem.likes}
                    </span>
                    <span className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {currentItem.comments.length}
                    </span>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                    <button
                      onClick={() => onSelectContent(currentItem.id)}
                      className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                    >
                      <span>Découvrir</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSharingItem(currentItem)}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 shadow-lg border border-white/30"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Partager</span>
                    </button>
                    <span className="text-sm opacity-75">
                      Par {currentItem.author} • {new Date(currentItem.date).toLocaleDateString('fr-FR')}
                    </span>
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
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 z-20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Slide Indicators */}
          {contentItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {contentItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-125 shadow-lg' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            {contentItems.length > 1 ? `${currentIndex + 1} sur ${contentItems.length} nouveautés` : 'Dernière nouveauté'}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleViewContent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
            >
              Voir tout le contenu
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>

    {sharingItem && (
      <ShareModal
        contentId={sharingItem.id}
        title={sharingItem.title}
        description={sharingItem.description}
        thumbnail={sharingItem.thumbnail || sharingItem.url}
        onClose={() => setSharingItem(null)}
      />
    )}
    </>
  );
};

export default FeaturedContentModal;
