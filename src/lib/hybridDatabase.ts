import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db as firebaseDb, ensureAuth } from './firebase';
import { supabase } from './supabase';
import type { DynamicForm, FormSubmission } from './supabase';

export const DATA_SOURCE = {
  FIREBASE: 'firebase',
  SUPABASE: 'supabase'
} as const;

let currentDataSource: 'firebase' | 'supabase' = 'firebase';

export const setDataSource = (source: 'firebase' | 'supabase') => {
  currentDataSource = source;
  console.log(`📊 Source de données active: ${source.toUpperCase()}`);
};

export const getCurrentDataSource = () => currentDataSource;

export const getForms = async (): Promise<DynamicForm[]> => {
  console.log(`📋 Lecture des formulaires depuis ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const formsRef = collection(firebaseDb, 'forms');
      const snapshot = await getDocs(formsRef);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
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
        };
      });
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return [];
    }

    return data || [];
  }
};

export const getSubmissions = async (formId?: string): Promise<FormSubmission[]> => {
  console.log(`📝 Lecture des inscriptions depuis ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const submissionsRef = collection(firebaseDb, 'form_submissions');
      let q;

      if (formId) {
        q = query(submissionsRef, where('form_id', '==', formId));
      } else {
        q = query(submissionsRef);
      }

      const snapshot = await getDocs(q);

      const submissions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
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
        };
      });

      submissions.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      return submissions;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return [];
    }
  } else {
    let query = supabase
      .from('form_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (formId) {
      query = query.eq('form_id', formId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return [];
    }

    return data || [];
  }
};

export const createForm = async (formData: Omit<DynamicForm, 'id'>): Promise<string | null> => {
  console.log(`➕ Création de formulaire dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const formsRef = collection(firebaseDb, 'forms');
      const docRef = await addDoc(formsRef, {
        ...formData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return null;
    }
  } else {
    const { data, error } = await supabase
      .from('forms')
      .insert([formData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return null;
    }

    return data?.id || null;
  }
};

export const updateForm = async (formId: string, updates: Partial<DynamicForm>): Promise<boolean> => {
  console.log(`✏️ Mise à jour du formulaire dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const formRef = doc(firebaseDb, 'forms', formId);
      await updateDoc(formRef, {
        ...updates,
        updated_at: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', formId);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }

    return true;
  }
};

export const deleteForm = async (formId: string): Promise<boolean> => {
  console.log(`🗑️ Suppression du formulaire dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const formRef = doc(firebaseDb, 'forms', formId);
      await deleteDoc(formRef);
      return true;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }

    return true;
  }
};

export const createSubmission = async (submissionData: Omit<FormSubmission, 'id'>): Promise<string | null> => {
  console.log(`➕ Création d'inscription dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      // ⚠️ NE PAS vérifier l'authentification pour les soumissions publiques
      // Les visiteurs non-authentifiés doivent pouvoir s'inscrire
      // await ensureAuth(); // COMMENTÉ POUR AUTORISER LES INSCRIPTIONS PUBLIQUES

      // Utiliser directement la fonction createSubmission de firebase.ts
      // qui gère l'authentification anonyme automatiquement
      const { createSubmission: firebaseCreateSubmission } = await import('./firebase');

      const submission = await firebaseCreateSubmission({
        form_id: submissionData.form_id || '',
        matricule: submissionData.matricule || '',
        submission_data: submissionData.submission_data || {},
        filiere_id: submissionData.filiere_id || null,
        filiere_name: submissionData.filiere_name || null,
        mention: submissionData.mention || null,
        filiere_id_2: submissionData.filiere_id_2 || null,
        filiere_name_2: submissionData.filiere_name_2 || null,
        mention_2: submissionData.mention_2 || null,
        status: submissionData.status || 'pending'
      });

      return submission.id;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return null;
    }
  } else {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return null;
    }

    return data?.id || null;
  }
};

export const updateSubmissionStatus = async (
  submissionId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> => {
  console.log(`✏️ Mise à jour du statut dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const submissionRef = doc(firebaseDb, 'form_submissions', submissionId);
      await updateDoc(submissionRef, {
        status,
        updated_at: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('form_submissions')
      .update({ status })
      .eq('id', submissionId);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }

    return true;
  }
};

export const deleteSubmission = async (submissionId: string): Promise<boolean> => {
  console.log(`🗑️ Suppression de l'inscription dans ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const submissionRef = doc(firebaseDb, 'form_submissions', submissionId);
      await deleteDoc(submissionRef);
      return true;
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', submissionId);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }

    return true;
  }
};

export const getEvents = async () => {
  console.log(`📅 Lecture des événements depuis ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const eventsRef = collection(firebaseDb, 'events');
      const snapshot = await getDocs(eventsRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return [];
    }

    return data || [];
  }
};

export const getContentItems = async () => {
  console.log(`📸 Lecture du contenu depuis ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const contentRef = collection(firebaseDb, 'content_items');
      const snapshot = await getDocs(contentRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return [];
    }

    return data || [];
  }
};

export const getForumPosts = async () => {
  console.log(`💬 Lecture du forum depuis ${currentDataSource.toUpperCase()}`);

  if (currentDataSource === 'firebase') {
    try {
      await ensureAuth();
      const forumRef = collection(firebaseDb, 'forum_posts');
      const snapshot = await getDocs(forumRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return [];
    }

    return data || [];
  }
};
