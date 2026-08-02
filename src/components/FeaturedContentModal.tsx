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

  useEffect(() => {
    if (!isAutoPlaying || contentItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % contentItems.length);
    }, 4000);
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
        featured_order: row.featured_order || 0,
      }));
      items.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.is_featured && b.is_featured) return (a.featured_order || 0) - (b.featured_order || 0);
        return 0;
      });
      setContentItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
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

  const pauseAndResume = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToPrevious = () => { setCurrentIndex(prev => prev === 0 ? contentItems.length - 1 : prev - 1); pauseAndResume(); };
  const goToNext = () => { setCurrentIndex(prev => (prev + 1) % contentItems.length); pauseAndResume(); };
  const goToSlide = (index: number) => { setCurrentIndex(index); pauseAndResume(); };

  const handleViewContent = () => { setActiveSection('contenu'); onClose(); };
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des nouveautés...</p>
        </div>
      </div>
    );
  }

  if (error || contentItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full relative text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nouveautés à venir</h3>
          <p className="text-gray-600 mb-6">
            {error ? 'Erreur de chargement du contenu' : 'Aucun contenu disponible pour le moment'}
          </p>
          <button onClick={handleViewContent} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Voir la section contenu
          </button>
        </div>
      </div>
    );
  }

  const currentItem = contentItems[currentIndex];
  const ContentIcon = getContentIcon(currentItem.type);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[95vh] flex flex-col relative">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-5 text-center flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">🎉 Actualités et Nouveautés</h2>
            <p className="text-blue-100 text-sm">Restez informé de tout ce qui se passe à l'ISTM Kinshasa</p>
          </div>

          {/* Carousel — scrollable area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
              {currentItem.type === 'image' ? (
                <img src={currentItem.thumbnail || currentItem.url} alt={currentItem.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-500" />
              )}
              <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full overflow-y-auto">
              <div className="min-h-full flex items-start sm:items-center p-5 sm:p-8">
                <div className="w-full text-white">

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full flex-shrink-0">
                      <ContentIcon className="h-4 w-4" />
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {getContentTypeLabel(currentItem.type)}
                    </span>
                    {isAutoPlaying && contentItems.length > 1 && (
                      <div className="bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span>Auto</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-2xl font-bold leading-snug mb-3">
                    {currentItem.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base opacity-90 mb-4 leading-relaxed line-clamp-3">
                    {currentItem.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />{currentItem.views}
                    </span>
                    <span className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      <Heart className="h-3.5 w-3.5 mr-1.5" />{currentItem.likes}
                    </span>
                    <span className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />{currentItem.comments.length}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => onSelectContent(currentItem.id)}
                      className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg text-sm"
                    >
                      <span>Découvrir</span>
                      <ArrowRight className="h-4 w-4 flex-shrink-0" />
                    </button>
                    <button
                      onClick={() => setSharingItem(currentItem)}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg border border-white/30 text-sm"
                    >
                      <Share2 className="h-4 w-4 flex-shrink-0" />
                      <span>Partager</span>
                    </button>
                    <span className="text-xs opacity-75 w-full sm:w-auto">
                      Par {currentItem.author} • {new Date(currentItem.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Nav Arrows */}
            {contentItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full transition-all z-20"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full transition-all z-20"
                  aria-label="Suivant"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {contentItems.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {contentItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? 'w-4 h-3 bg-white shadow-lg'
                        : 'w-3 h-3 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Diapo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-4 flex-shrink-0 border-t border-gray-200">
            <p className="text-gray-500 text-xs text-center mb-3">
              {contentItems.length > 1 ? `${currentIndex + 1} sur ${contentItems.length} nouveautés` : 'Dernière nouveauté'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleViewContent}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm flex-1 sm:flex-none"
              >
                Voir tout le contenu
              </button>
              <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm flex-1 sm:flex-none"
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
