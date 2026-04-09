import React, { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Link2, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  contentId: string;
  title: string;
  description: string;
  thumbnail?: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ contentId, title, description, thumbnail, onClose }) => {
  const [copied, setCopied] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const appUrl = window.location.origin;
  const shareUrl = `${supabaseUrl}/functions/v1/og-preview?contenu=${contentId}&app_url=${encodeURIComponent(appUrl)}`;
  const plainDescription = description.replace(/<[^>]*>/g, '').substring(0, 120);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + shareUrl)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: plainDescription,
          url: shareUrl,
        });
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-5 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Partager cette publication</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
            {thumbnail && (
              <img
                src={thumbnail}
                alt={title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">{title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plainDescription}</p>
              <p className="text-xs text-blue-500 mt-1 truncate">{shareUrl}</p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Partager via</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <button
              onClick={shareOnFacebook}
              className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors duration-200 group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Facebook</span>
            </button>

            <button
              onClick={shareOnTwitter}
              className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors duration-200 group"
            >
              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Twitter className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Twitter / X</span>
            </button>

            <button
              onClick={shareOnWhatsapp}
              className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors duration-200 group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </button>
          </div>

          {/* Copy Link */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 truncate font-mono">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copié!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 text-sm font-medium"
            >
              <Link2 className="h-4 w-4" />
              <span>Autres options de partage</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
