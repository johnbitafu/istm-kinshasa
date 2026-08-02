import React, { useState, useEffect, useRef } from 'react';
import { Play, FileText, MessageCircle, Heart, Eye, Calendar, X, Send, ArrowLeft, Share2, CreditCard as Edit3, ChevronLeft, ChevronRight, Images, Maximize2 } from 'lucide-react';
import { supabase, getContentItems, addCommentToContentItem, updateContentItem } from '../lib/supabase';
import type { ContentItem, Comment } from '../lib/supabase';
import { useAuth } from './AuthGuard';
import ShareModal from './ShareModal';
import StudentLoginModal from './StudentLoginModal';

interface ContentSectionProps {
  selectedContentId?: string | null;
  onContentIdConsumed?: () => void;
}

interface ContentType {
  value: string;
  label: string;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(p => (p - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(p => (p + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full z-10">
          {idx + 1} / {images.length}
        </span>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt=""
        className="max-w-full max-h-full object-contain select-none"
        style={{ maxHeight: '90vh', maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors z-10"
            onClick={e => { e.stopPropagation(); setIdx(p => (p - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors z-10"
            onClick={e => { e.stopPropagation(); setIdx(p => (p + 1) % images.length); }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dot strip */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`rounded-full transition-all duration-200 ${i === idx ? 'w-4 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Smooth Carousel ─────────────────────────────────────────────────────────
interface CarouselProps {
  images: string[];
  /** show fullscreen button */
  onOpenLightbox: (index: number) => void;
  /** height class */
  heightClass?: string;
  autoPlay?: boolean;
}

const SmoothCarousel: React.FC<CarouselProps> = ({
  images,
  onOpenLightbox,
  heightClass = 'h-72 md:h-96',
  autoPlay = false,
}) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlay && images.length > 1) {
      timerRef.current = setInterval(() => setCurrent(p => (p + 1) % images.length), 4000);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, autoPlay]);

  const go = (dir: number) => {
    setCurrent(p => (p + dir + images.length) % images.length);
    resetTimer();
  };

  if (images.length === 0) {
    return (
      <div className={`${heightClass} bg-gradient-to-br from-blue-700 to-green-600 relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="h-16 w-16 text-white/30" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${heightClass} relative overflow-hidden bg-black`}>
      {/* Sliding track */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 relative">
            <img
              src={src}
              alt=""
              className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

      {/* Zoom button */}
      <button
        onClick={() => onOpenLightbox(current)}
        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
        title="Voir en grand"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); resetTimer(); }}
                className={`rounded-full transition-all duration-200 ${i === current ? 'w-4 h-2.5 bg-white shadow-md' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>

          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
            <Images className="h-3 w-3" />{current + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ContentSection: React.FC<ContentSectionProps> = ({ selectedContentId, onContentIdConsumed }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentTab, setCommentTab] = useState<'view' | 'write'>('view');
  const [sharingContent, setSharingContent] = useState<ContentItem | null>(null);
  const [cardSlides, setCardSlides] = useState<Record<string, number>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingLikeItem, setPendingLikeItem] = useState<ContentItem | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('istm_liked_items');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const ITEMS_PER_PAGE = 9;
  const { user, isStudent } = useAuth();

  const loadContentItems = async (loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true);
      setError(null);
      const result = await getContentItems(ITEMS_PER_PAGE, loadMore ? lastDoc : undefined);
      setContentItems(prev => loadMore ? [...prev, ...result.items] : result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadContentTypes = async () => {
    const { data } = await supabase
      .from('content_types')
      .select('value, label')
      .order('is_base', { ascending: false })
      .order('label', { ascending: true });
    if (data) setContentTypes(data as ContentType[]);
  };

  useEffect(() => { loadContentItems(); loadContentTypes(); }, []);

  useEffect(() => {
    if (!selectedContentId) return;
    supabase
      .from('content_items')
      .select('*')
      .eq('id', selectedContentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelectedContent({ ...data, comments: data.comments || [] } as ContentItem);
          onContentIdConsumed?.();
        }
      });
  }, [selectedContentId]);

  const filterOptions = [
    { id: 'all', label: 'Tout' },
    ...contentTypes.map(t => ({ id: t.value, label: t.label })),
  ];

  const filteredContent = activeFilter === 'all'
    ? contentItems
    : contentItems.filter(item => item.type === activeFilter);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return FileText;
      default: return Eye;
    }
  };

  const getItemImages = (item: ContentItem): string[] => {
    if (item.images && item.images.length > 0) return item.images;
    const fallback = item.thumbnail || item.url;
    return fallback ? [fallback] : [];
  };

  const cardSlide = (id: string) => cardSlides[id] || 0;
  const setCardSlide = (id: string, idx: number) =>
    setCardSlides(prev => ({ ...prev, [id]: idx }));

  const handleAddComment = async (contentId: string) => {
    if (!newComment.trim() || !selectedContent) return;
    if (!user || !isStudent()) { setShowLoginModal(true); return; }
    try {
      await addCommentToContentItem(contentId, { author: user.name, content: newComment } as Partial<Comment>);
      await loadContentItems();
      const updated = contentItems.find(item => item.id === contentId);
      if (updated) setSelectedContent(updated);
    } catch {
      alert('Erreur lors de l\'ajout du commentaire');
    }
    setNewComment('');
  };

  const doLike = async (item: ContentItem) => {
    const alreadyLiked = likedItems.has(item.id);
    const newLikes = alreadyLiked ? Math.max(0, item.likes - 1) : item.likes + 1;
    const newSet = new Set(likedItems);
    alreadyLiked ? newSet.delete(item.id) : newSet.add(item.id);
    setLikedItems(newSet);
    localStorage.setItem('istm_liked_items', JSON.stringify([...newSet]));
    try {
      await updateContentItem(item.id, { likes: newLikes });
      setContentItems(prev => prev.map(c => c.id === item.id ? { ...c, likes: newLikes } : c));
      if (selectedContent?.id === item.id) setSelectedContent({ ...selectedContent, likes: newLikes });
    } catch {
      setLikedItems(likedItems);
      localStorage.setItem('istm_liked_items', JSON.stringify([...likedItems]));
    }
  };

  const handleLike = (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    if (!user || !isStudent()) { setPendingLikeItem(item); setShowLoginModal(true); return; }
    doLike(item);
  };

  const handleViewContent = async (item: ContentItem) => {
    try {
      const newViews = item.views + 1;
      await updateContentItem(item.id, { views: newViews });
      const updated = { ...item, views: newViews };
      setContentItems(prev => prev.map(c => c.id === item.id ? updated : c));
      setSelectedContent(updated);
    } catch {
      setSelectedContent(item);
    }
  };

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Actualités</h2>
          <p className="text-xl text-gray-600">
            Laissez vous informer sur la vie quotidienne du campus ISTM-Kinshasa
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {filterOptions.map(option => (
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-medium">Erreur de chargement du contenu</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucun contenu disponible</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredContent.map(item => {
                const IconComponent = getContentIcon(item.type);
                const imgs = getItemImages(item);
                const cur = cardSlide(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleViewContent(item)}
                  >
                    {/* Card carousel */}
                    <div className="relative h-48 overflow-hidden rounded-t-xl bg-black">
                      {imgs.length > 0 && (
                        <div
                          className="flex h-full transition-transform duration-300 ease-in-out will-change-transform"
                          style={{ transform: `translateX(-${cur * 100}%)` }}
                        >
                          {imgs.map((src, i) => (
                            <div key={i} className="w-full h-full flex-shrink-0">
                              <img
                                src={src}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-blue-600 text-white p-2 rounded-full z-10">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      {imgs.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10"
                            onClick={e => { e.stopPropagation(); setCardSlide(item.id, (cur - 1 + imgs.length) % imgs.length); }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10"
                            onClick={e => { e.stopPropagation(); setCardSlide(item.id, (cur + 1) % imgs.length); }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                            {imgs.map((_, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === cur ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                          </div>
                          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full z-10 flex items-center gap-1">
                            <Images className="h-3 w-3" />{imgs.length}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      <div
                        className="text-gray-600 mb-4 line-clamp-3 text-sm"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{item.author}</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-gray-500 pt-4 border-t border-gray-100 text-sm">
                        <button
                          onClick={e => handleLike(e, item)}
                          className={`flex items-center transition-colors ${likedItems.has(item.id) ? 'text-red-500' : 'hover:text-red-400'}`}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${likedItems.has(item.id) ? 'fill-current' : ''}`} />
                          {item.likes}
                        </button>
                        <span className="flex items-center"><Eye className="h-4 w-4 mr-1" />{item.views}</span>
                        <span className="flex items-center"><MessageCircle className="h-4 w-4 mr-1" />{item.comments.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => loadContentItems(true)}
                  disabled={loadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Chargement...</span></>
                  ) : (
                    <><Eye className="h-5 w-5" /><span>Charger plus</span></>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Article Detail Modal ─────────────────────────────────────────── */}
        {selectedContent && (() => {
          const modalImgs = getItemImages(selectedContent);
          return (
            <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-4">
              <div className="min-h-screen flex items-start justify-center py-8">
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">

                  {/* Header gradient */}
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-4 text-center flex-shrink-0 relative">
                    <h2 className="text-xl md:text-2xl font-bold">Détail de l'Actualité</h2>
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Smooth carousel with auto-play */}
                  <div className="relative">
                    <SmoothCarousel
                      images={modalImgs}
                      heightClass="h-64 sm:h-80 md:h-96"
                      autoPlay={true}
                      onOpenLightbox={idx => setLightbox({ images: modalImgs, index: idx })}
                    />

                    {/* Overlay: back button + content info */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Back */}
                      <div className="absolute top-3 left-3 pointer-events-auto">
                        <button
                          onClick={() => setSelectedContent(null)}
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm font-semibold shadow"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Retour</span>
                        </button>
                      </div>

                      {/* Info bottom overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 md:p-6 pointer-events-none">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
                            {selectedContent.type}
                          </span>
                        </div>
                        <h1 className="text-white font-bold text-base sm:text-xl md:text-2xl leading-tight mb-2">
                          {selectedContent.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-white/80 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedContent.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span>Par {selectedContent.author}</span>
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                            <Eye className="h-3 w-3" />{selectedContent.views}
                          </span>
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                            <Heart className="h-3 w-3" />{selectedContent.likes}
                          </span>
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                            <MessageCircle className="h-3 w-3" />{selectedContent.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 md:p-8 lg:p-12">
                    <div className="max-w-4xl mx-auto">
                      {/* Action Bar */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={e => handleLike(e, selectedContent)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              likedItems.has(selectedContent.id)
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${likedItems.has(selectedContent.id) ? 'fill-current' : ''}`} />
                            {selectedContent.likes}
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            {selectedContent.comments.length}
                          </button>
                        </div>
                        <button
                          onClick={() => setSharingContent(selectedContent)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="hidden md:inline font-medium">Partager</span>
                        </button>
                      </div>

                      {/* Description */}
                      <div
                        className="prose prose-sm md:prose-lg max-w-none mb-10 text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedContent.description }}
                      />

                      {/* Comments */}
                      <div className="mt-10 pt-8 border-t-2 border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageCircle className="h-6 w-6 text-blue-600" />
                            Commentaires ({selectedContent.comments.length})
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCommentTab('view')}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                commentTab === 'view' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden md:inline">Voir</span>
                            </button>
                            <button
                              onClick={() => { if (!user || !isStudent()) setShowLoginModal(true); else setCommentTab('write'); }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                commentTab === 'write' ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <Edit3 className="h-4 w-4" />
                              <span className="hidden md:inline">Écrire</span>
                            </button>
                          </div>
                        </div>

                        {commentTab === 'view' && (
                          <div className="space-y-4">
                            {selectedContent.comments.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium">Aucun commentaire pour le moment</p>
                                <p className="text-gray-400 text-sm mt-2">Soyez le premier à partager votre avis!</p>
                              </div>
                            ) : (
                              selectedContent.comments.map((comment, index) => (
                                <div key={comment.id || index} className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                      {comment.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-900 block text-sm">{comment.author}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {commentTab === 'write' && (
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 md:p-6 rounded-xl">
                            <textarea
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              placeholder={user && isStudent() ? 'Partagez votre avis...' : 'Connectez-vous avec votre matricule pour commenter'}
                              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white transition-all text-sm"
                              rows={4}
                              disabled={!user || !isStudent()}
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
                              <p className="text-xs text-gray-600">
                                {!user || !isStudent() ? 'Connexion requise pour commenter' : 'Soyez respectueux et constructif'}
                              </p>
                              <button
                                onClick={() => { handleAddComment(selectedContent.id); setCommentTab('view'); }}
                                disabled={!user || !isStudent() || !newComment.trim()}
                                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg text-sm"
                              >
                                <Send className="h-4 w-4" />
                                {user && isStudent() ? 'Publier' : 'Connexion requise'}
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
          );
        })()}
      </div>

      {/* Modals */}
      {sharingContent && (
        <ShareModal
          contentId={sharingContent.id}
          title={sharingContent.title}
          description={sharingContent.description}
          thumbnail={sharingContent.thumbnail || sharingContent.url}
          onClose={() => setSharingContent(null)}
        />
      )}

      {showLoginModal && (
        <StudentLoginModal
          onClose={() => { setShowLoginModal(false); setPendingLikeItem(null); }}
          onSuccess={() => { if (pendingLikeItem) { doLike(pendingLikeItem); setPendingLikeItem(null); } }}
        />
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
};

export default ContentSection;
