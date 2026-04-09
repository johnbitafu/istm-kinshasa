import React, { useState } from 'react';
import { X, User, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from './AuthGuard';

interface StudentLoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const StudentLoginModal: React.FC<StudentLoginModalProps> = ({ onClose, onSuccess }) => {
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule.trim()) return;
    setLoading(true);
    setError('');
    const success = await login(matricule.trim().toUpperCase());
    setLoading(false);
    if (success) {
      onSuccess?.();
      onClose();
    } else {
      setError('Matricule non trouvé ou inscription non approuvée.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Connexion Étudiant</h2>
              <p className="text-white/80 text-xs">Pour aimer et commenter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro de matricule
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Ex: ISTM20250001"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Matricule reçu après validation de votre inscription
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !matricule.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLoginModal;
