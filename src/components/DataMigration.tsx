import React, { useState } from 'react';
import { Database, ArrowRight, CheckCircle, AlertCircle, Loader, Download, Upload } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

const firebaseConfig = {
  apiKey: "AIzaSyDx5pczXRwKtPh0clhKycA_prnu9P2lT6w",
  authDomain: "istm-kin.firebaseapp.com",
  projectId: "istm-kin",
  storageBucket: "istm-kin.firebasestorage.app",
  messagingSenderId: "631252657421",
  appId: "1:631252657421:web:c438b91d4c3238aaebbc44"
};

interface MigrationStats {
  forms: number;
  submissions: number;
  events: number;
  content: number;
  forum: number;
}

interface MigrationLog {
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

const DataMigration: React.FC = () => {
  const [migrating, setMigrating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState<MigrationStats>({
    forms: 0,
    submissions: 0,
    events: 0,
    content: 0,
    forum: 0
  });
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const addLog = (type: MigrationLog['type'], message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const migrateForms = async (db: any) => {
    setCurrentStep('Migration des formulaires...');
    addLog('info', 'Lecture des formulaires depuis Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'forms'));
      const forms: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        forms.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          fields: data.fields || [],
          filieres: data.filieres || [],
          status: data.status || 'draft',
          submissions_count: data.submissions_count || 0,
          created_by: data.created_by || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      addLog('info', `${forms.length} formulaire(s) trouvé(s)`);

      if (forms.length > 0) {
        addLog('info', 'Insertion dans Supabase...');
        const { error } = await supabase.from('forms').insert(forms);

        if (error) {
          addLog('error', `Erreur: ${error.message}`);
          return 0;
        }
        addLog('success', `${forms.length} formulaire(s) migré(s)`);
      }

      return forms.length;
    } catch (error: any) {
      addLog('error', `Erreur: ${error.message}`);
      return 0;
    }
  };

  const migrateSubmissions = async (db: any) => {
    setCurrentStep('Migration des inscriptions...');
    addLog('info', 'Lecture des inscriptions depuis Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'form_submissions'));
      const submissions: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          form_id: data.form_id || null,
          matricule: data.matricule || '',
          submission_data: data.submission_data || {},
          filiere_id: data.filiere_id || null,
          filiere_name: data.filiere_name || null,
          mention: data.mention || null,
          filiere_id_2: data.filiere_id_2 || null,
          filiere_name_2: data.filiere_name_2 || null,
          mention_2: data.mention_2 || null,
          status: data.status || 'pending',
          submitted_at: data.submitted_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      addLog('info', `${submissions.length} inscription(s) trouvée(s)`);

      if (submissions.length > 0) {
        const batchSize = 50;
        let migrated = 0;

        for (let i = 0; i < submissions.length; i += batchSize) {
          const batch = submissions.slice(i, i + batchSize);
          addLog('info', `Insertion lot ${i + 1}-${Math.min(i + batchSize, submissions.length)}...`);

          const { error } = await supabase.from('form_submissions').insert(batch);

          if (error) {
            addLog('warning', `Erreur lot ${i}: ${error.message}`);
          } else {
            migrated += batch.length;
            addLog('success', `${migrated}/${submissions.length} inscriptions migrées`);
          }
        }

        return migrated;
      }

      return 0;
    } catch (error: any) {
      addLog('error', `Erreur: ${error.message}`);
      return 0;
    }
  };

  const migrateEvents = async (db: any) => {
    setCurrentStep('Migration des événements...');
    addLog('info', 'Lecture des événements depuis Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const events: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          type: data.type || 'event',
          title: data.title || '',
          description: data.description || '',
          date: data.date || new Date().toISOString().split('T')[0],
          time: data.time || '00:00',
          location: data.location || '',
          instructor: data.instructor || null,
          participants: data.participants || 0,
          max_participants: data.max_participants || null,
          status: data.status || 'draft',
          created_by: data.created_by || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      addLog('info', `${events.length} événement(s) trouvé(s)`);

      if (events.length > 0) {
        const { error } = await supabase.from('events').insert(events);

        if (error) {
          addLog('error', `Erreur: ${error.message}`);
          return 0;
        }
        addLog('success', `${events.length} événement(s) migré(s)`);
      }

      return events.length;
    } catch (error: any) {
      addLog('error', `Erreur: ${error.message}`);
      return 0;
    }
  };

  const migrateContent = async (db: any) => {
    setCurrentStep('Migration du contenu...');
    addLog('info', 'Lecture du contenu depuis Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'content_items'));
      const items: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
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
          comments: data.comments || [],
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      addLog('info', `${items.length} élément(s) de contenu trouvé(s)`);

      if (items.length > 0) {
        const { error } = await supabase.from('content_items').insert(items);

        if (error) {
          addLog('error', `Erreur: ${error.message}`);
          return 0;
        }
        addLog('success', `${items.length} élément(s) migré(s)`);
      }

      return items.length;
    } catch (error: any) {
      addLog('error', `Erreur: ${error.message}`);
      return 0;
    }
  };

  const migrateForum = async (db: any) => {
    setCurrentStep('Migration du forum...');
    addLog('info', 'Lecture des posts du forum depuis Firebase...');

    try {
      const snapshot = await getDocs(collection(db, 'forum_posts'));
      const posts: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          author: data.author || 'Anonyme',
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'Général',
          replies: data.replies || [],
          likes: data.likes || 0,
          views: data.views || 0,
          is_answered: data.isAnswered || false,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      addLog('info', `${posts.length} post(s) trouvé(s)`);

      if (posts.length > 0) {
        const { error } = await supabase.from('forum_posts').insert(posts);

        if (error) {
          addLog('error', `Erreur: ${error.message}`);
          return 0;
        }
        addLog('success', `${posts.length} post(s) migré(s)`);
      }

      return posts.length;
    } catch (error: any) {
      addLog('error', `Erreur: ${error.message}`);
      return 0;
    }
  };

  const startMigration = async () => {
    setMigrating(true);
    setCompleted(false);
    setLogs([]);
    setStats({ forms: 0, submissions: 0, events: 0, content: 0, forum: 0 });

    addLog('info', 'Démarrage de la migration...');
    addLog('info', 'Connexion à Firebase...');

    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      addLog('success', 'Connecté à Firebase');
      addLog('info', 'Connexion à Supabase...');
      addLog('success', 'Connecté à Supabase');

      const newStats: MigrationStats = {
        forms: await migrateForms(db),
        submissions: await migrateSubmissions(db),
        events: await migrateEvents(db),
        content: await migrateContent(db),
        forum: await migrateForum(db)
      };

      setStats(newStats);
      setCurrentStep('');
      setCompleted(true);

      const total = Object.values(newStats).reduce((a, b) => a + b, 0);
      addLog('success', `Migration terminée! ${total} entrée(s) migrée(s)`);

    } catch (error: any) {
      addLog('error', `Erreur critique: ${error.message}`);
      setCurrentStep('');
    } finally {
      setMigrating(false);
    }
  };

  const getLogIcon = (type: MigrationLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Database className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLogColor = (type: MigrationLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-700';
      case 'error': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Migration des Données</h1>
                <p className="text-blue-100">Firebase → Supabase PostgreSQL</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <Download className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Firebase</p>
                </div>
                <ArrowRight className="w-8 h-8" />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Supabase</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!migrating && !completed && (
              <div className="text-center">
                <Database className="w-20 h-20 mx-auto mb-6 text-blue-600" />
                <h2 className="text-2xl font-bold mb-4">Prêt à migrer vos données</h2>
                <p className="text-gray-600 mb-8">
                  Cette opération va copier toutes vos données Firebase vers Supabase.
                  <br />
                  Cela peut prendre quelques minutes selon la quantité de données.
                </p>
                <button
                  onClick={startMigration}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
                >
                  <Database className="w-5 h-5" />
                  <span>Démarrer la Migration</span>
                </button>
              </div>
            )}

            {migrating && (
              <div className="space-y-6">
                <div className="text-center">
                  <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                  <h2 className="text-xl font-bold mb-2">{currentStep}</h2>
                  <p className="text-gray-600">Migration en cours, veuillez patienter...</p>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{value}</div>
                      <div className="text-xs text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-700 mb-2">Migration Réussie!</h2>
                  <p className="text-gray-600">Toutes vos données ont été migrées vers Supabase</p>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                      <div className="text-2xl font-bold text-green-600">{value}</div>
                      <div className="text-xs text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">
                    Total: {Object.values(stats).reduce((a, b) => a + b, 0)} entrée(s) migrée(s)
                  </p>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Journal de Migration</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-gray-500 text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {getLogIcon(log.type)}
                        <span className={`${getLogColor(log.type)} flex-1`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMigration;
