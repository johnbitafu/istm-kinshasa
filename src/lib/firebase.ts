import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ==========================================
// SYSTÈME DE CACHE CÔTÉ CLIENT
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache global en mémoire
const dataCache = new Map<string, CacheEntry<any>>();

// Durée de vie du cache (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Fonction utilitaire pour gérer le cache
async function getCachedData<T>(
  key: string, 
  fetchFunction: () => Promise<T>, 
  forceRefresh: boolean = false
): Promise<T> {
  const now = Date.now();
  
  // Vérifier si on a des données en cache et si elles sont encore valides
  if (!forceRefresh && dataCache.has(key)) {
    const cached = dataCache.get(key)!;
    if (now < cached.expiresAt) {
      console.log(`📦 Cache HIT pour ${key} (expire dans ${Math.round((cached.expiresAt - now) / 1000)}s)`);
      return cached.data;
    } else {
      console.log(`⏰ Cache EXPIRED pour ${key}`);
      dataCache.delete(key);
    }
  }
  
  // Récupérer les données depuis Firebase
  console.log(`🔥 Cache MISS pour ${key} - Lecture Firebase`);
  const data = await fetchFunction();
  
  // Stocker dans le cache
  dataCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_DURATION
  });
  
  return data;
}

// Fonction pour invalider le cache
export function invalidateCache(key: string): void {
  if (dataCache.has(key)) {
    dataCache.delete(key);
    console.log(`🗑️ Cache invalidé pour ${key}`);
  }
}

// Fonction pour vider tout le cache
export function clearAllCache(): void {
  const size = dataCache.size;
  dataCache.clear();
  console.log(`🧹 Cache entièrement vidé (${size} entrées supprimées)`);
}

// Fonction pour obtenir les statistiques du cache
export function getCacheStats(): { size: number; entries: Array<{ key: string; age: number; expiresIn: number }> } {
  const now = Date.now();
  const entries = Array.from(dataCache.entries()).map(([key, entry]) => ({
    key,
    age: Math.round((now - entry.timestamp) / 1000),
    expiresIn: Math.round((entry.expiresAt - now) / 1000)
  }));
  
  return {
    size: dataCache.size,
    entries
  };
}

// Configuration Firebase - À remplacer par vos vraies clés
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);

// Utiliser l'émulateur Firestore en mode test si pas de règles configurées
if (import.meta.env.DEV) {
  console.log('🔧 Mode développement: utilisation des règles de test Firestore');
}

// Initialiser Auth
export const auth = getAuth(app);

// Désactiver l'authentification pour le moment
export const ensureAuth = async () => {
  try {
    if (!auth.currentUser) {
      console.log('🔐 Connexion anonyme Firebase...');
      await signInAnonymously(auth);
      console.log('✅ Authentification anonyme réussie');
    }
    return auth.currentUser;
  } catch (error) {
    console.error('❌ Erreur authentification Firebase:', error);
    throw error;
  }
};

// Indicateur de configuration
export const isDatabaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Configuration pour le mode test (règles permissives)
console.log('🔥 Firebase configuré en mode développement');
console.log('⚠️ IMPORTANT: Vous devez configurer les règles Firestore dans la console Firebase');
console.log('📋 Copiez les règles du fichier firestore.rules dans Firebase Console > Firestore Database > Rules');
console.log('🔗 Ou utilisez ces règles de test:');
console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`);

// Types pour TypeScript
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'student'
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  type: 'event' | 'conference' | 'forum' | 'class'
  title: string
  description: string
  date: string
  time: string
  location: string
  instructor?: string
  participants: number
  max_participants?: number
  status: 'draft' | 'published' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'file'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  order: number
  validation?: {
    min?: number
    max?: number
    pattern?: string
    minLength?: number
    maxLength?: number
  }
  description?: string
}

export interface Filiere {
  id: string
  name: string
  mentions: string[]
}

export interface DynamicForm {
  id: string
  title: string
  description: string
  fields: FormField[]
  filieres?: Filiere[]
  status: 'draft' | 'published' | 'archived'
  submissions_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: string
  form_id: string
  matricule: string
  submission_data: { [key: string]: any }
  filiere_id?: string
  filiere_name?: string
  mention?: string
  filiere_id_2?: string
  filiere_name_2?: string
  mention_2?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  type: 'news' | 'event' | 'conference' | 'forum' | 'class'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// Interfaces pour les événements
export interface Event {
  id: string
  type: 'event' | 'conference' | 'forum' | 'class'
  title: string
  description: string
  date: string
  time: string
  location: string
  instructor?: string
  participants: number
  max_participants?: number
  status: 'draft' | 'published' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

// Interfaces pour le contenu
export interface Comment {
  id: string
  author: string
  content: string
  date: string
}

export interface ContentItem {
  id: string
  type: 'image' | 'video' | 'article' | 'communique' | 'annonce' | 'actualite'
  title: string
  description: string
  url: string
  thumbnail?: string
  author: string
  date: string
  likes: number
  views: number
  comments: Comment[]
  created_at: string
  updated_at: string
}

// Interfaces pour le forum
export interface Reply {
  id: string
  author: string
  content: string
  date: string
  isAnswer: boolean
}

export interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  date: string
  category: string
  replies: Reply[]
  likes: number
  views: number
  isAnswered: boolean
  created_at: string
  updated_at: string
}

// Fonctions Firebase pour les formulaires
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';

import { getFieldValue } from '../utils/pdfGenerator';

export async function getForms(): Promise<DynamicForm[]> {
  return getCachedData('forms', async () => {
    try {
      if (!isDatabaseConfigured) {
        console.log('📝 Firebase non configuré, utilisation des données de démonstration');
        
        // Retourne un formulaire de démonstration
        const demoForm: DynamicForm = {
          id: 'demo-form-1',
          title: 'Formulaire d\'inscription ISTM Kinshasa 2025',
          description: 'Formulaire officiel d\'inscription pour les nouveaux étudiants de l\'Institut Supérieur des Techniques Médicales de Kinshasa',
          fields: [
            { id: '1', type: 'text', label: 'Nom', required: true, placeholder: 'Votre nom de famille', order: 1 },
            { id: '2', type: 'text', label: 'Post-Nom', required: true, placeholder: 'Votre post-nom', order: 2 },
            { id: '3', type: 'text', label: 'Prénom', required: true, placeholder: 'Votre prénom', order: 3 },
            { id: '4', type: 'email', label: 'E-mail', required: true, placeholder: 'votre.email@exemple.com', order: 4 },
            { id: '5', type: 'tel', label: 'Téléphone', required: true, placeholder: '+243XXXXXXXXX', order: 5 },
            { id: '6', type: 'date', label: 'Date de naissance', required: true, order: 6 },
            { id: '7', type: 'select', label: 'Sexe', required: true, options: ['Masculin', 'Féminin'], order: 7 },
            { id: '8', type: 'text', label: 'Lieu de naissance', required: true, placeholder: 'Ville de naissance', order: 8 }
          ],
          filieres: [
            {
              id: 'bm',
              name: 'Biologie Médicale (BM)',
              mentions: ['Techniques de laboratoire', 'Analyses biomédicales', 'Microbiologie']
            },
            {
              id: 'si',
              name: 'Soins Infirmiers (SI)',
              mentions: ['Soins généraux', 'Soins intensifs', 'Pédiatrie']
            },
            {
              id: 'im',
              name: 'Imagerie Médicale (IM)',
              mentions: ['Radiologie', 'Échographie', 'Scanner']
            }
          ],
          status: 'published',
          submissions_count: 0,
          created_by: 'demo-admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return [demoForm];
      }

      // Charger les formulaires depuis Firebase
      await ensureAuth();
      const formsRef = collection(db, 'forms');
      const q = query(formsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const forms: DynamicForm[] = [];
      querySnapshot.forEach((doc) => {
        forms.push({
          id: doc.id,
          ...doc.data()
        } as DynamicForm);
      });
      
      console.log(`📋 ${forms.length} formulaire(s) chargé(s) depuis Firebase`);
      return forms;
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires:', error);
      
      // Fallback vers les données de démonstration en cas d'erreur
      console.log('⚠️ Fallback vers les données de démonstration');
      const demoForm: DynamicForm = {
        id: 'demo-form-1',
        title: 'Formulaire d\'inscription ISTM Kinshasa 2025',
        description: 'Formulaire officiel d\'inscription pour les nouveaux étudiants de l\'Institut Supérieur des Techniques Médicales de Kinshasa',
        fields: [
          { id: '1', type: 'text', label: 'Nom', required: true, placeholder: 'Votre nom de famille', order: 1 },
          { id: '2', type: 'text', label: 'Post-Nom', required: true, placeholder: 'Votre post-nom', order: 2 },
          { id: '3', type: 'text', label: 'Prénom', required: true, placeholder: 'Votre prénom', order: 3 },
          { id: '4', type: 'email', label: 'E-mail', required: true, placeholder: 'votre.email@exemple.com', order: 4 }
        ],
        filieres: [
          {
            id: 'bm',
            name: 'Biologie Médicale (BM)',
            mentions: ['Techniques de laboratoire', 'Analyses biomédicales']
          }
        ],
        status: 'published',
        submissions_count: 0,
        created_by: 'demo-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return [demoForm];
    }
  });
}

export async function createForm(formData: Partial<DynamicForm>): Promise<DynamicForm> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, création locale');
      
      const newForm: DynamicForm = {
        id: `form-${Date.now()}`,
        title: formData.title || 'Nouveau Formulaire',
        description: formData.description || '',
        fields: formData.fields || [],
        filieres: formData.filieres || [],
        status: formData.status || 'draft',
        submissions_count: 0,
        created_by: 'demo-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newForm;
    }

    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    console.log('🔥 Création du formulaire dans Firebase...');
    console.log('📋 Données du formulaire à créer:', formData);
    const formsRef = collection(db, 'forms');
    const newFormData = {
      ...formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submissions_count: 0
    };
    
    // Ajouter des métadonnées pour contourner les règles
    const formWithMeta = {
      ...newFormData,
      _createdBy: auth.currentUser?.uid || 'anonymous',
      _timestamp: Date.now()
    };
    
    const docRef = await addDoc(formsRef, formWithMeta);
    
    console.log('✅ Formulaire créé dans Firebase avec ID:', docRef.id);
    console.log('📋 Filières sauvegardées:', formWithMeta.filieres?.length || 0);
    
    // Invalider le cache des formulaires
    invalidateCache('forms');
    
    return {
      id: docRef.id,
      ...newFormData
    } as DynamicForm;
  } catch (error) {
    console.error('Erreur lors de la création du formulaire:', error);
    
    // Fallback en mode local si Firebase échoue
    console.log('⚠️ Fallback: création en mode local');
    const newForm: DynamicForm = {
      id: `local-form-${Date.now()}`,
      title: formData.title || 'Nouveau Formulaire',
      description: formData.description || '',
      fields: formData.fields || [],
      filieres: formData.filieres || [],
      status: formData.status || 'draft',
      submissions_count: 0,
      created_by: 'local-admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return newForm;
  }
}

export async function updateForm(id: string, formData: Partial<DynamicForm>): Promise<DynamicForm> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, mise à jour locale');
      
      const updatedForm: DynamicForm = {
        id,
        title: formData.title || 'Formulaire Mis à Jour',
        description: formData.description || '',
        fields: formData.fields || [],
        filieres: formData.filieres || [],
        status: formData.status || 'draft',
        submissions_count: formData.submissions_count || 0,
        created_by: 'demo-admin',
        created_at: formData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return updatedForm;
    }

    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    console.log('🔥 Mise à jour du formulaire dans Firebase...');
    console.log('📋 Données du formulaire à mettre à jour:', formData);
    const formRef = doc(db, 'forms', id);
    const updateData = {
      ...formData,
      updated_at: new Date().toISOString(),
      _updatedBy: auth.currentUser?.uid || 'anonymous',
      _timestamp: Date.now()
    };
    
    await updateDoc(formRef, updateData);
    
    console.log('✅ Formulaire mis à jour dans Firebase');
    console.log('📋 Filières mises à jour:', updateData.filieres?.length || 0);
    
    // Invalider le cache des formulaires
    invalidateCache('forms');
    
    return {
      id,
      ...updateData
    } as DynamicForm;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du formulaire:', error);
    
    // Fallback en mode local si Firebase échoue
    console.log('⚠️ Fallback: mise à jour en mode local');
    const updatedForm: DynamicForm = {
      id,
      title: formData.title || 'Formulaire Mis à Jour',
      description: formData.description || '',
      fields: formData.fields || [],
      filieres: formData.filieres || [],
      status: formData.status || 'draft',
      submissions_count: formData.submissions_count || 0,
      created_by: 'local-admin',
      created_at: formData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return updatedForm;
  }
}

export async function updateFormSubmissionCount(formId: string, count: number): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, mise à jour locale du compteur');
      return;
    }

    await ensureAuth();
    
    const formRef = doc(db, 'forms', formId);
    await updateDoc(formRef, {
      submissions_count: count,
      updated_at: new Date().toISOString()
    });
    
    console.log(`✅ Compteur de soumissions mis à jour pour le formulaire ${formId}: ${count}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du compteur:', error);
  }
}

export async function deleteForm(id: string): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, suppression locale simulée');
      return;
    }

    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    console.log('🗑️ Suppression du formulaire dans Firebase...', id);
    const formRef = doc(db, 'forms', id);
    await deleteDoc(formRef);
    
    // Invalider le cache des formulaires
    invalidateCache('forms');
    
    console.log('✅ Formulaire supprimé de Firebase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du formulaire:', error);
    throw error;
  }
}

// Fonctions pour les soumissions
export async function createSubmission(submissionData: Partial<FormSubmission>): Promise<FormSubmission> {
  try {
    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, simulation de soumission');
      
      const newSubmission: FormSubmission = {
        id: `submission-${Date.now()}`,
        form_id: submissionData.form_id || '',
        matricule: submissionData.matricule || '',
        submission_data: submissionData.submission_data || {},
        filiere_id: submissionData.filiere_id,
        filiere_name: submissionData.filiere_name,
        mention: submissionData.mention,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newSubmission;
    }

    // Vérification des doublons avant création
    console.log('🔍 Vérification des doublons dans Firebase...');
    const submissionsRef = collection(db, 'form_submissions');
    
    // Extraire les données pour la vérification
    const nom = submissionData.submission_data?.nom || submissionData.submission_data?.Nom || '';
    const postnom = getFieldValue(submissionData.submission_data, ['postnom', 'post-nom', 'Post-Nom', 'Post-nom']);
    const prenom = getFieldValue(submissionData.submission_data, ['prenom', 'prénom', 'Prénom']);
    
    console.log('📋 Données de vérification des doublons:', { nom, postnom, prenom });
    
    // Vérifier si une soumission avec les mêmes nom, post-nom et prénom existe déjà
    if (nom && nom.trim() && postnom && postnom.trim() && prenom && prenom.trim()) {
      console.log('🔍 Recherche de doublons pour:', { nom: nom.trim(), postnom: postnom.trim(), prenom: prenom.trim() });
      
      // Requête Firestore pour chercher des doublons potentiels
      // Note: Firestore limite les clauses where sur des champs différents, donc on utilise nom et prenom
      const duplicateQuery = query(
        submissionsRef,
        where('submission_data.nom', '==', nom.trim()),
        where('submission_data.prenom', '==', prenom.trim())
      );
      
      try {
        const duplicateSnapshot = await getDocs(duplicateQuery);
        
        // Vérifier manuellement le post-nom parmi les résultats
        const duplicates = [];
        duplicateSnapshot.forEach((doc) => {
          const data = doc.data();
          const docPostnom = getFieldValue(data.submission_data, ['postnom', 'post-nom', 'Post-Nom', 'Post-nom']);
          
          // Comparaison insensible à la casse et aux espaces
          if (docPostnom && docPostnom.trim().toLowerCase() === postnom.trim().toLowerCase()) {
            duplicates.push(doc);
          }
        });
        
        if (duplicates.length > 0) {
          console.log('❌ Doublon détecté:', duplicates.length, 'soumission(s) avec le même nom, post-nom et prénom');
          console.log('📋 Détails du doublon détecté:', {
            nom: nom.trim(),
            postnom: postnom.trim(),
            prenom: prenom.trim()
          });
          
          const error = new Error(`Une inscription avec le nom "${nom.trim()}", le post-nom "${postnom.trim()}" et le prénom "${prenom.trim()}" existe déjà dans notre base de données. Les soumissions multiples ne sont pas autorisées.`);
          (error as any).code = 'DUPLICATE_SUBMISSION';
          throw error;
        }
        
        console.log('✅ Aucun doublon détecté pour cette combinaison nom/post-nom/prénom, création autorisée');
      } catch (queryError: any) {
        if (queryError.code === 'DUPLICATE_SUBMISSION') {
          throw queryError;
        }
        console.error('⚠️ Erreur lors de la vérification des doublons:', queryError);
        // En cas d'erreur de requête, on bloque la création par sécurité
        throw new Error('Erreur lors de la vérification des doublons. Veuillez réessayer.');
      }
    } else {
      console.warn('⚠️ Données incomplètes pour la vérification des doublons - nom, post-nom ou prénom manquant');
      const missingFields = [];
      if (!nom || !nom.trim()) missingFields.push('nom');
      if (!postnom || !postnom.trim()) missingFields.push('post-nom');
      if (!prenom || !prenom.trim()) missingFields.push('prénom');
      
      throw new Error(`Les champs suivants sont obligatoires pour éviter les doublons: ${missingFields.join(', ')}`);
    }
    // Créer la soumission dans Firebase
    console.log('🔥 Création de la soumission dans Firebase...', submissionData);
    const newSubmissionData = {
      ...submissionData,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending'
    };
    
    const docRef = await addDoc(submissionsRef, newSubmissionData);
    console.log('✅ Soumission créée avec ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...newSubmissionData
    } as FormSubmission;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la soumission:', error);
    
    // Relancer l'erreur avec le code spécifique pour les doublons
    if ((error as any).code === 'DUPLICATE_SUBMISSION') {
      throw error;
    }
    
    // Pour les autres erreurs, ajouter un message plus explicite
    const enhancedError = new Error(`Erreur lors de la sauvegarde: ${(error as Error).message}`);
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
}

export async function getSubmissions(): Promise<FormSubmission[]> {
  try {
    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, aucune soumission disponible');
      return [];
    }

    // Charger les soumissions depuis Firebase
    const submissionsRef = collection(db, 'form_submissions');
    const q = query(submissionsRef, orderBy('submitted_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const submissions: FormSubmission[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      } as FormSubmission);
    });
    
    console.log(`✅ ${submissions.length} soumission(s) chargée(s) depuis Firebase`);
    return submissions;
  } catch (error) {
    console.error('Erreur lors du chargement des soumissions:', error);
    throw error;
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, suppression locale simulée');
      return;
    }

    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    console.log('🗑️ Suppression de la soumission dans Firebase...', id);
    const submissionRef = doc(db, 'form_submissions', id);
    await deleteDoc(submissionRef);
    
    console.log('✅ Soumission supprimée de Firebase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la soumission:', error);
    throw error;
  }
}

export async function updateSubmissionStatus(submissionId: string, newStatus: 'pending' | 'approved' | 'rejected'): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📝 Firebase non configuré, mise à jour locale simulée');
      return;
    }

    // S'assurer que l'utilisateur est authentifié
    await ensureAuth();
    
    console.log(`🔄 Mise à jour du statut de la soumission ${submissionId} vers ${newStatus}...`);
    const submissionRef = doc(db, 'form_submissions', submissionId);
    
    await updateDoc(submissionRef, {
      status: newStatus,
      updated_at: new Date().toISOString(),
      updated_by: auth.currentUser?.uid || 'anonymous'
    });
    
    console.log(`✅ Statut de la soumission mis à jour vers ${newStatus}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}
// ==========================================
// FONCTIONS POUR LES ÉVÉNEMENTS
// ==========================================

export async function getEvents(): Promise<Event[]> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📅 Firebase non configuré, utilisation des événements de démonstration');
      
      const demoEvents: Event[] = [
        {
          id: 'demo-event-1',
          type: 'conference',
          title: 'Conférence sur les nouvelles techniques chirurgicales',
          description: 'Présentation des dernières innovations en chirurgie minimalement invasive',
          date: '2025-02-15',
          time: '14:00',
          location: 'Amphithéâtre A',
          instructor: 'Dr. Mukamba',
          participants: 45,
          max_participants: 100,
          status: 'published',
          created_by: 'demo-admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-event-2',
          type: 'class',
          title: 'Cours d\'Anatomie - Système Cardiovasculaire',
          description: 'Étude détaillée du cœur et des vaisseaux sanguins',
          date: '2025-01-20',
          time: '09:00',
          location: 'Salle 201',
          instructor: 'Prof. Kabongo',
          participants: 25,
          max_participants: 30,
          status: 'published',
          created_by: 'demo-admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return demoEvents;
    }

    await ensureAuth();
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const events: Event[] = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as Event);
    });
    
    console.log(`📅 ${events.length} événement(s) chargé(s) depuis Firebase`);
    return events;
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
    
    // Fallback vers les données de démonstration
    const demoEvents: Event[] = [
      {
        id: 'demo-event-1',
        type: 'conference',
        title: 'Conférence sur les nouvelles techniques chirurgicales',
        description: 'Présentation des dernières innovations en chirurgie minimalement invasive',
        date: '2025-02-15',
        time: '14:00',
        location: 'Amphithéâtre A',
        instructor: 'Dr. Mukamba',
        participants: 45,
        max_participants: 100,
        status: 'published',
        created_by: 'demo-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return demoEvents;
  }
}

export async function createEvent(eventData: Partial<Event>): Promise<Event> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📅 Firebase non configuré, création locale d\'événement');
      
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        type: eventData.type || 'event',
        title: eventData.title || 'Nouvel Événement',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        instructor: eventData.instructor,
        participants: 0,
        max_participants: eventData.max_participants,
        status: eventData.status || 'draft',
        created_by: 'demo-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newEvent;
    }

    await ensureAuth();
    
    console.log('🔥 Création de l\'événement dans Firebase...');
    const eventsRef = collection(db, 'events');
    const newEventData = {
      ...eventData,
      participants: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: auth.currentUser?.uid || 'anonymous'
    };
    
    const docRef = await addDoc(eventsRef, newEventData);
    
    console.log('✅ Événement créé dans Firebase avec ID:', docRef.id);
    return {
      id: docRef.id,
      ...newEventData
    } as Event;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📅 Firebase non configuré, mise à jour locale');
      
      const updatedEvent: Event = {
        id,
        type: eventData.type || 'event',
        title: eventData.title || 'Événement Mis à Jour',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        instructor: eventData.instructor,
        participants: eventData.participants || 0,
        max_participants: eventData.max_participants,
        status: eventData.status || 'draft',
        created_by: 'demo-admin',
        created_at: eventData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return updatedEvent;
    }

    await ensureAuth();
    
    console.log('🔥 Mise à jour de l\'événement dans Firebase...');
    const eventRef = doc(db, 'events', id);
    const updateData = {
      ...eventData,
      updated_at: new Date().toISOString(),
      updated_by: auth.currentUser?.uid || 'anonymous'
    };
    
    await updateDoc(eventRef, updateData);
    
    console.log('✅ Événement mis à jour dans Firebase');
    return {
      id,
      ...updateData
    } as Event;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📅 Firebase non configuré, suppression locale simulée');
      return;
    }

    await ensureAuth();
    
    console.log('🗑️ Suppression de l\'événement dans Firebase...', id);
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
    
    console.log('✅ Événement supprimé de Firebase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'événement:', error);
    throw error;
  }
}

// ==========================================
// FONCTIONS POUR LE CONTENU
// ==========================================

export async function getContentItems(
  pageSize: number = 10, 
  lastDoc?: DocumentSnapshot
): Promise<{ items: ContentItem[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📸 Firebase non configuré, utilisation du contenu de démonstration');
      
      const demoContent: ContentItem[] = [
        {
          id: 'demo-content-1',
          type: 'image',
          title: 'Anatomie du système cardiovasculaire',
          description: 'Illustration détaillée du cœur et des vaisseaux sanguins',
          url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
          author: 'Dr. Mukamba',
          date: '2025-01-15',
          likes: 24,
          views: 156,
          comments: [
            { id: '1', author: 'Étudiant A', content: 'Très instructif, merci !', date: '2025-01-16' }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-content-2',
          type: 'video',
          title: 'Techniques d\'injection intramusculaire',
          description: 'Démonstration pratique des bonnes techniques d\'injection',
          url: '#',
          thumbnail: 'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?auto=compress&cs=tinysrgb&w=800',
          author: 'Prof. Kabongo',
          date: '2025-01-14',
          likes: 42,
          views: 289,
          comments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return { items: demoContent, hasMore: false };
    }

    await ensureAuth();
    const contentRef = collection(db, 'content_items');
    let q = query(contentRef, orderBy('created_at', 'desc'), limit(pageSize));
    
    if (lastDoc) {
      q = query(contentRef, orderBy('created_at', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    const content: ContentItem[] = [];
    let lastVisible: DocumentSnapshot | undefined;
    
    querySnapshot.forEach((doc) => {
      content.push({
        id: doc.id,
        ...doc.data()
      } as ContentItem);
      lastVisible = doc;
    });
    
    const hasMore = content.length === pageSize;
    
    console.log(`📸 ${content.length} élément(s) de contenu chargé(s) depuis Firebase (hasMore: ${hasMore})`);
    return { items: content, lastDoc: lastVisible, hasMore };
  } catch (error) {
    console.error('Erreur lors du chargement du contenu:', error);
    
    // Fallback vers les données de démonstration
    const demoContent: ContentItem[] = [
      {
        id: 'demo-content-1',
        type: 'image',
        title: 'Anatomie du système cardiovasculaire',
        description: 'Illustration détaillée du cœur et des vaisseaux sanguins',
        url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
        author: 'Dr. Mukamba',
        date: '2025-01-15',
        likes: 24,
        views: 156,
        comments: [
          { id: '1', author: 'Étudiant A', content: 'Très instructif, merci !', date: '2025-01-16' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { items: demoContent, hasMore: false };
  }
}

export async function createContentItem(itemData: Partial<ContentItem>): Promise<ContentItem> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📸 Firebase non configuré, création locale de contenu');
      
      const newItem: ContentItem = {
        id: `content-${Date.now()}`,
        type: itemData.type || 'article',
        title: itemData.title || 'Nouveau Contenu',
        description: itemData.description || '',
        url: itemData.url || '',
        thumbnail: itemData.thumbnail,
        author: itemData.author || 'Anonyme',
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        views: 0,
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newItem;
    }

    await ensureAuth();
    
    console.log('🔥 Création du contenu dans Firebase...');
    const contentRef = collection(db, 'content_items');
    const newItemData = {
      ...itemData,
      likes: 0,
      views: 0,
      comments: [],
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: auth.currentUser?.uid || 'anonymous'
    };
    
    const docRef = await addDoc(contentRef, newItemData);
    
    console.log('✅ Contenu créé dans Firebase avec ID:', docRef.id);
    
    // Invalider le cache du contenu (si on en avait un)
    invalidateCache('content_items');
    
    return {
      id: docRef.id,
      ...newItemData
    } as ContentItem;
  } catch (error) {
    console.error('Erreur lors de la création du contenu:', error);
    throw error;
  }
}

export async function addCommentToContentItem(contentItemId: string, commentData: Partial<Comment>): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📸 Firebase non configuré, ajout de commentaire local simulé');
      return;
    }

    await ensureAuth();
    
    console.log('💬 Ajout de commentaire au contenu dans Firebase...');
    
    // Récupérer l'élément de contenu actuel
    const contentRef = doc(db, 'content_items', contentItemId);
    const contentDoc = await getDocs(query(collection(db, 'content_items'), where('__name__', '==', contentItemId)));
    
    if (!contentDoc.empty) {
      const currentData = contentDoc.docs[0].data() as ContentItem;
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        author: commentData.author || 'Anonyme',
        content: commentData.content || '',
        date: new Date().toISOString().split('T')[0]
      };
      
      const updatedComments = [...(currentData.comments || []), newComment];
      
      await updateDoc(contentRef, {
        comments: updatedComments,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Commentaire ajouté au contenu dans Firebase');
      
      // Invalider le cache du contenu
      invalidateCache('content_items');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    throw error;
  }
}

export async function updateContentItem(contentItemId: string, updates: Partial<ContentItem>): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📸 Firebase non configuré, mise à jour locale simulée');
      return;
    }

    await ensureAuth();
    
    console.log('📸 Mise à jour du contenu dans Firebase...');
    const contentRef = doc(db, 'content_items', contentItemId);
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await updateDoc(contentRef, updateData);
    
    console.log('✅ Contenu mis à jour dans Firebase');
    
    // Invalider le cache du contenu
    invalidateCache('content_items');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu:', error);
    throw error;
  }
}
// ==========================================
export async function deleteContentItem(contentItemId: string): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('📸 Firebase non configuré, suppression locale simulée');
      return;
    }

    await ensureAuth();
    
    console.log('🗑️ Suppression du contenu dans Firebase...', contentItemId);
    const contentRef = doc(db, 'content_items', contentItemId);
    await deleteDoc(contentRef);
    
    console.log('✅ Contenu supprimé de Firebase');
    
    // Invalider le cache du contenu
    invalidateCache('content_items');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du contenu:', error);
    throw error;
  }
}
// FONCTIONS POUR LE FORUM
// ==========================================

export async function getForumPosts(
  pageSize: number = 10, 
  lastDoc?: DocumentSnapshot
): Promise<{ posts: ForumPost[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> {
  try {
    if (!isDatabaseConfigured) {
      console.log('💬 Firebase non configuré, utilisation des posts de démonstration');
      
      const demoPosts: ForumPost[] = [
        {
          id: 'demo-post-1',
          title: 'Question sur l\'anatomie cardiaque',
          content: 'Pouvez-vous m\'expliquer la différence entre les oreillettes et les ventricules ?',
          author: 'Étudiant A',
          date: '2025-01-15',
          category: 'anatomie',
          replies: [
            {
              id: 'reply-1',
              author: 'Dr. Mukamba',
              content: 'Les oreillettes sont les cavités supérieures du cœur qui reçoivent le sang, tandis que les ventricules sont les cavités inférieures qui pompent le sang.',
              date: '2025-01-15',
              isAnswer: true
            }
          ],
          likes: 12,
          views: 45,
          isAnswered: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return { posts: demoPosts, hasMore: false };
    }

    await ensureAuth();
    const postsRef = collection(db, 'forum_posts');
    let q = query(postsRef, orderBy('created_at', 'desc'), limit(pageSize));
    
    if (lastDoc) {
      q = query(postsRef, orderBy('created_at', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    const posts: ForumPost[] = [];
    let lastVisible: DocumentSnapshot | undefined;
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as ForumPost);
      lastVisible = doc;
    });
    
    const hasMore = posts.length === pageSize;
    
    console.log(`💬 ${posts.length} post(s) de forum chargé(s) depuis Firebase (hasMore: ${hasMore})`);
    return { posts, lastDoc: lastVisible, hasMore };
  } catch (error) {
    console.error('Erreur lors du chargement des posts de forum:', error);
    
    // Fallback vers les données de démonstration
    const demoPosts: ForumPost[] = [
      {
        id: 'demo-post-1',
        title: 'Question sur l\'anatomie cardiaque',
        content: 'Pouvez-vous m\'expliquer la différence entre les oreillettes et les ventricules ?',
        author: 'Étudiant A',
        date: '2025-01-15',
        category: 'anatomie',
        replies: [],
        likes: 0,
        views: 0,
        isAnswered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { posts: demoPosts, hasMore: false };
  }
}

export async function createForumPost(postData: Partial<ForumPost>): Promise<ForumPost> {
  try {
    if (!isDatabaseConfigured) {
      console.log('💬 Firebase non configuré, création locale de post');
      
      const newPost: ForumPost = {
        id: `post-${Date.now()}`,
        title: postData.title || 'Nouvelle Question',
        content: postData.content || '',
        author: postData.author || 'Anonyme',
        date: new Date().toISOString().split('T')[0],
        category: postData.category || 'general',
        replies: [],
        likes: 0,
        views: 0,
        isAnswered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newPost;
    }

    await ensureAuth();
    
    console.log('🔥 Création du post de forum dans Firebase...');
    const postsRef = collection(db, 'forum_posts');
    const newPostData = {
      ...postData,
      replies: [],
      likes: 0,
      views: 0,
      isAnswered: false,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: auth.currentUser?.uid || 'anonymous'
    };
    
    const docRef = await addDoc(postsRef, newPostData);
    
    console.log('✅ Post de forum créé dans Firebase avec ID:', docRef.id);
    
    // Invalider le cache des posts de forum (si on en avait un)
    invalidateCache('forum_posts');
    
    return {
      id: docRef.id,
      ...newPostData
    } as ForumPost;
  } catch (error) {
    console.error('Erreur lors de la création du post de forum:', error);
    throw error;
  }
}

export async function addReplyToForumPost(postId: string, replyData: Partial<Reply>): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.log('💬 Firebase non configuré, ajout de réponse local simulé');
      return;
    }

    await ensureAuth();
    
    console.log('💬 Ajout de réponse au post de forum dans Firebase...');
    
    // Récupérer le post actuel
    const postRef = doc(db, 'forum_posts', postId);
    const postDoc = await getDocs(query(collection(db, 'forum_posts'), where('__name__', '==', postId)));
    
    if (!postDoc.empty) {
      const currentData = postDoc.docs[0].data() as ForumPost;
      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        author: replyData.author || 'Anonyme',
        content: replyData.content || '',
        date: new Date().toISOString().split('T')[0],
        isAnswer: replyData.isAnswer || false
      };
      
      const updatedReplies = [...(currentData.replies || []), newReply];
      const isAnswered = updatedReplies.some(reply => reply.isAnswer) || currentData.isAnswered;
      
      await updateDoc(postRef, {
        replies: updatedReplies,
        isAnswered: isAnswered,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Réponse ajoutée au post de forum dans Firebase');
      
      // Invalider le cache des posts de forum
      invalidateCache('forum_posts');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error);
    throw error;
  }
}