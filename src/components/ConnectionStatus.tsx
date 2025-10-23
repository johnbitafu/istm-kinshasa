import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { isDatabaseConfigured } from '../lib/supabase';

const ConnectionStatus: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  // Masquer complètement le composant
  useEffect(() => {
    setIsVisible(false);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${isDatabaseConfigured ? 'bg-green-500' : 'bg-orange-500'} text-white py-3 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            {isDatabaseConfigured ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          
          <div>
            {isDatabaseConfigured ? (
              <div>
                <h4 className="font-semibold text-sm">Firebase connecté ✅</h4>
                <p className="text-sm opacity-90">Base de données opérationnelle</p>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-sm">Configuration Firebase requise</h4>
                <p className="text-sm opacity-90">Configurez Firebase pour activer toutes les fonctionnalités</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isDatabaseConfigured && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Instructions</span>
            </button>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors duration-200"
          >
            ×
          </button>
        </div>
      </div>

      {/* Instructions détaillées */}
      {showInstructions && !isDatabaseConfigured && (
        <div className="mt-4 bg-white/10 rounded-lg p-4">
          <h3 className="font-semibold mb-3">🔥 Configuration Firebase (Gratuite)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-medium">Créer un projet Firebase</p>
                <p className="opacity-90">Allez sur <a href="https://console.firebase.google.com" target="_blank" className="underline">console.firebase.google.com</a> et créez un nouveau projet</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-medium">Activer Firestore</p>
                <p className="opacity-90">Dans votre projet, allez dans "Firestore Database" et créez une base de données</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-medium">Configurer l'application Web</p>
                <p className="opacity-90">Dans "Project Settings" &gt; "General", ajoutez une app Web et copiez la configuration</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-medium">Créer le fichier .env</p>
                <p className="opacity-90">Créez un fichier .env avec vos clés Firebase (voir .env.example)</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">
              <strong>💡 Avantages Firebase :</strong> Base de données NoSQL gratuite, 
              authentification intégrée, hébergement gratuit, et 1GB de stockage gratuit par mois.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;