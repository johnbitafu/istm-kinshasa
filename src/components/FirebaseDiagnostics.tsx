import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, Eye, Trash2, Download } from 'lucide-react';
import { isDatabaseConfigured, getForms, getSubmissions } from '../lib/supabase';
import type { DynamicForm, FormSubmission } from '../lib/supabase';

const FirebaseDiagnostics: React.FC = () => {
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Chargement des données Firebase...');
      
      // Charger les formulaires
      const formsData = await getForms();
      setForms(formsData);
      console.log(`✅ ${formsData.length} formulaire(s) chargé(s):`, formsData);
      
      // Charger les soumissions
      const submissionsData = await getSubmissions();
      setSubmissions(submissionsData);
      console.log(`✅ ${submissionsData.length} soumission(s) chargée(s):`, submissionsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      firebase_configured: isDatabaseConfigured,
      forms: forms,
      submissions: submissions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diagnostics Firebase</h2>
        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter données</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Statut de connexion */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Statut de la connexion</h3>
        <div className="flex items-center space-x-3">
          {isDatabaseConfigured ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Firebase configuré ✅</p>
                <p className="text-sm text-green-700">Base de données opérationnelle</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Firebase non configuré ⚠️</p>
                <p className="text-sm text-orange-700">Utilisation des données de démonstration</p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Erreur de chargement</p>
          </div>
          <p className="text-red-700 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Formulaires */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Formulaires sauvegardés ({forms.length})
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun formulaire trouvé</p>
            <p className="text-sm mt-2">Créez un formulaire dans la section "Formulaires"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{form.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>ID: {form.id}</span>
                      <span>Statut: {form.status}</span>
                      <span>{form.fields.length} champs</span>
                      <span>{form.filieres?.length || 0} filières</span>
                      <span>Créé: {new Date(form.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                    className="text-blue-600 hover:text-blue-800 ml-4"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                
                {selectedForm?.id === form.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Détails du formulaire:</h5>
                    <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                      {JSON.stringify(form, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soumissions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Inscriptions reçues ({submissions.length})
        </h3>
        
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune inscription reçue</p>
            <p className="text-sm mt-2">Les inscriptions apparaîtront ici une fois soumises</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Matricule: {submission.matricule}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Filière: {submission.filiere_name || 'Non spécifiée'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Soumis le: {new Date(submission.submitted_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
                
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <h5 className="text-sm font-medium mb-2">Données soumises:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(submission.submission_data).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Comment vérifier vos données</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Console Firebase:</strong> Allez sur console.firebase.google.com → Votre projet → Firestore Database</p>
          <p><strong>2. Collections:</strong> Vérifiez les collections "forms" et "form_submissions"</p>
          <p><strong>3. Console navigateur:</strong> Ouvrez les outils de développement (F12) pour voir les logs détaillés</p>
          <p><strong>4. Export:</strong> Utilisez le bouton "Exporter données" pour télécharger toutes les données</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDiagnostics;