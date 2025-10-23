import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle } from 'lucide-react';
import { setDataSource, getCurrentDataSource } from '../lib/hybridDatabase';

const DatabaseSelector: React.FC = () => {
  const [source, setSource] = useState<'firebase' | 'supabase'>(getCurrentDataSource());
  const [showNotification, setShowNotification] = useState(false);

  const handleSourceChange = (newSource: 'firebase' | 'supabase') => {
    setSource(newSource);
    setDataSource(newSource);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    window.location.reload();
  };

  return (
    <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Source de Données</h3>
            <p className="text-sm text-gray-600">Choisissez quelle base de données utiliser</p>
          </div>
        </div>

        {showNotification && (
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Source modifiée!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSourceChange('firebase')}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            source === 'firebase'
              ? 'border-orange-500 bg-orange-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-orange-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              source === 'firebase' ? 'bg-orange-500' : 'bg-gray-200'
            }`}>
              <Database className={`w-8 h-8 ${
                source === 'firebase' ? 'text-white' : 'text-gray-500'
              }`} />
            </div>

            <div className="text-center">
              <h4 className={`text-xl font-bold mb-1 ${
                source === 'firebase' ? 'text-orange-700' : 'text-gray-700'
              }`}>
                Firebase
              </h4>
              <p className="text-sm text-gray-600">Données existantes</p>
            </div>

            {source === 'firebase' && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-orange-500" />
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-orange-600">Lecture seule</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Statut:</span>
                <span className="font-semibold text-green-600">✓ Connecté</span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSourceChange('supabase')}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            source === 'supabase'
              ? 'border-green-500 bg-green-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              source === 'supabase' ? 'bg-green-500' : 'bg-gray-200'
            }`}>
              <Database className={`w-8 h-8 ${
                source === 'supabase' ? 'text-white' : 'text-gray-500'
              }`} />
            </div>

            <div className="text-center">
              <h4 className={`text-xl font-bold mb-1 ${
                source === 'supabase' ? 'text-green-700' : 'text-gray-700'
              }`}>
                Supabase
              </h4>
              <p className="text-sm text-gray-600">Base PostgreSQL</p>
            </div>

            {source === 'supabase' && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-green-600">Lecture/Écriture</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Statut:</span>
                <span className="font-semibold text-green-600">✓ Prêt</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Mode Hybride Actif</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Firebase:</strong> Accès en lecture à vos données existantes</li>
              <li>• <strong>Supabase:</strong> Nouvelle base de données pour toutes les futures données</li>
              <li>• Utilisez la page Migration pour transférer vos données vers Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSelector;
