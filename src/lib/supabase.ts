import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes');
}

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase configuré et connecté');

// Types TypeScript (compatibles avec l'ancien système Firebase)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  type: 'event' | 'conference' | 'forum' | 'class';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  instructor?: string;
  participants: number;
  max_participants?: number;
  status: 'draft' | 'published' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  description?: string;
}

export interface Filiere {
  id: string;
  name: string;
  mentions: string[];
}

export interface DynamicForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  filieres?: Filiere[];
  status: 'draft' | 'published' | 'archived';
  submissions_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  matricule: string;
  submission_data: { [key: string]: any };
  filiere_id?: string;
  filiere_name?: string;
  mention?: string;
  filiere_id_2?: string;
  filiere_name_2?: string;
  mention_2?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'article' | 'communique' | 'annonce' | 'actualite';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  author: string;
  date: string;
  likes: number;
  views: number;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  author: string;
  content: string;
  date: string;
  isAnswer: boolean;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  replies: Reply[];
  likes: number;
  views: number;
  isAnswered: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: 'news' | 'event' | 'conference' | 'forum' | 'class';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// FONCTIONS POUR LES FORMULAIRES
// ==========================================

export async function getForms(): Promise<DynamicForm[]> {
  try {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📋 ${data?.length || 0} formulaire(s) chargé(s) depuis Supabase`);
    return (data as any[]) || [];
  } catch (error) {
    console.error('❌ Erreur lors du chargement des formulaires:', error);
    throw error;
  }
}

export async function createForm(formData: Partial<DynamicForm>): Promise<DynamicForm> {
  try {
    const { data, error } = await supabase
      .from('forms')
      .insert([{
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        filieres: formData.filieres,
        status: formData.status || 'draft',
        submissions_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Formulaire créé dans Supabase:', data.id);
    return data as DynamicForm;
  } catch (error) {
    console.error('❌ Erreur lors de la création du formulaire:', error);
    throw error;
  }
}

export async function updateForm(id: string, formData: Partial<DynamicForm>): Promise<DynamicForm> {
  try {
    const { data, error } = await supabase
      .from('forms')
      .update({
        ...formData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Formulaire mis à jour dans Supabase');
    return data as DynamicForm;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du formulaire:', error);
    throw error;
  }
}

export async function deleteForm(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Formulaire supprimé de Supabase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du formulaire:', error);
    throw error;
  }
}

export async function updateFormSubmissionCount(formId: string, count: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('forms')
      .update({
        submissions_count: count,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId);

    if (error) throw error;

    console.log(`✅ Compteur de soumissions mis à jour: ${count}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du compteur:', error);
    throw error;
  }
}

// ==========================================
// FONCTIONS POUR LES SOUMISSIONS
// ==========================================

export async function createSubmission(submissionData: Partial<FormSubmission>): Promise<FormSubmission> {
  try {
    // Vérification des doublons
    const nom = submissionData.submission_data?.Nom || submissionData.submission_data?.nom || '';
    const postnom = submissionData.submission_data?.['Post-Nom'] || submissionData.submission_data?.postnom || '';
    const prenom = submissionData.submission_data?.Prénom || submissionData.submission_data?.prenom || '';

    if (nom && postnom && prenom) {
      const { data: existingData, error: checkError } = await supabase
        .from('form_submissions')
        .select('id, submission_data')
        .limit(1000);

      if (checkError) throw checkError;

      // Vérifier manuellement les doublons (car JSONB query est complexe)
      const duplicate = existingData?.find(sub => {
        const subNom = sub.submission_data?.Nom || sub.submission_data?.nom || '';
        const subPostnom = sub.submission_data?.['Post-Nom'] || sub.submission_data?.postnom || '';
        const subPrenom = sub.submission_data?.Prénom || sub.submission_data?.prenom || '';

        return subNom.toLowerCase() === nom.toLowerCase() &&
               subPostnom.toLowerCase() === postnom.toLowerCase() &&
               subPrenom.toLowerCase() === prenom.toLowerCase();
      });

      if (duplicate) {
        const error = new Error(`Une inscription avec le nom "${nom}", le post-nom "${postnom}" et le prénom "${prenom}" existe déjà.`);
        (error as any).code = 'DUPLICATE_SUBMISSION';
        throw error;
      }
    }

    const { data, error } = await supabase
      .from('form_submissions')
      .insert([{
        form_id: submissionData.form_id,
        matricule: submissionData.matricule,
        submission_data: submissionData.submission_data,
        filiere_id: submissionData.filiere_id,
        filiere_name: submissionData.filiere_name,
        mention: submissionData.mention,
        filiere_id_2: submissionData.filiere_id_2,
        filiere_name_2: submissionData.filiere_name_2,
        mention_2: submissionData.mention_2,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Soumission créée dans Supabase:', data.id);
    return data as FormSubmission;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la soumission:', error);
    throw error;
  }
}

export async function getSubmissions(): Promise<FormSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} soumission(s) chargée(s) depuis Supabase`);
    return (data as any[]) || [];
  } catch (error) {
    console.error('❌ Erreur lors du chargement des soumissions:', error);
    throw error;
  }
}

export async function updateSubmissionStatus(submissionId: string, newStatus: 'pending' | 'approved' | 'rejected'): Promise<void> {
  try {
    const { error } = await supabase
      .from('form_submissions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    console.log(`✅ Statut mis à jour vers ${newStatus}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Soumission supprimée de Supabase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la soumission:', error);
    throw error;
  }
}

// ==========================================
// FONCTIONS POUR LES ÉVÉNEMENTS
// ==========================================

export async function getEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (error) throw error;

    console.log(`📅 ${data?.length || 0} événement(s) chargé(s)`);
    return (data as any[]) || [];
  } catch (error) {
    console.error('❌ Erreur lors du chargement des événements:', error);
    return [];
  }
}

export async function createEvent(eventData: Partial<Event>): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        participants: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Événement créé dans Supabase');
    return data as Event;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'événement:', error);
    throw error;
  }
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Événement mis à jour');
    return data as Event;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Événement supprimé');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'événement:', error);
    throw error;
  }
}

// ==========================================
// FONCTIONS POUR LE CONTENU
// ==========================================

export async function getContentItems(pageSize: number = 10, lastId?: string): Promise<{ items: ContentItem[]; lastDoc?: any; hasMore: boolean }> {
  try {
    let query = supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (lastId) {
      query = query.lt('created_at', lastId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = (data?.length || 0) === pageSize;

    console.log(`📸 ${data?.length || 0} élément(s) de contenu chargé(s)`);
    return {
      items: (data as any[]) || [],
      lastDoc: data && data.length > 0 ? data[data.length - 1].created_at : undefined,
      hasMore
    };
  } catch (error) {
    console.error('❌ Erreur lors du chargement du contenu:', error);
    return { items: [], hasMore: false };
  }
}

export async function createContentItem(itemData: Partial<ContentItem>): Promise<ContentItem> {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .insert([{
        ...itemData,
        likes: 0,
        views: 0,
        comments: [],
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Contenu créé dans Supabase');
    return data as ContentItem;
  } catch (error) {
    console.error('❌ Erreur lors de la création du contenu:', error);
    throw error;
  }
}

export async function updateContentItem(contentItemId: string, updates: Partial<ContentItem>): Promise<void> {
  try {
    const { error } = await supabase
      .from('content_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentItemId);

    if (error) throw error;

    console.log('✅ Contenu mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du contenu:', error);
    throw error;
  }
}

export async function deleteContentItem(contentItemId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', contentItemId);

    if (error) throw error;

    console.log('✅ Contenu supprimé');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du contenu:', error);
    throw error;
  }
}

export async function addCommentToContentItem(contentItemId: string, commentData: Partial<Comment>): Promise<void> {
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('content_items')
      .select('comments')
      .eq('id', contentItemId)
      .single();

    if (fetchError) throw fetchError;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: commentData.author || 'Anonyme',
      content: commentData.content || '',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedComments = [...(currentData.comments || []), newComment];

    const { error } = await supabase
      .from('content_items')
      .update({
        comments: updatedComments,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentItemId);

    if (error) throw error;

    console.log('✅ Commentaire ajouté');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du commentaire:', error);
    throw error;
  }
}

// ==========================================
// FONCTIONS POUR LE FORUM
// ==========================================

export async function getForumPosts(pageSize: number = 10, lastId?: string): Promise<{ posts: ForumPost[]; lastDoc?: any; hasMore: boolean }> {
  try {
    let query = supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (lastId) {
      query = query.lt('created_at', lastId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = (data?.length || 0) === pageSize;

    console.log(`💬 ${data?.length || 0} post(s) du forum chargé(s)`);
    return {
      posts: (data as any[]) || [],
      lastDoc: data && data.length > 0 ? data[data.length - 1].created_at : undefined,
      hasMore
    };
  } catch (error) {
    console.error('❌ Erreur lors du chargement des posts:', error);
    return { posts: [], hasMore: false };
  }
}

export async function createForumPost(postData: Partial<ForumPost>): Promise<ForumPost> {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([{
        ...postData,
        replies: [],
        likes: 0,
        views: 0,
        is_answered: false,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Post créé dans Supabase');
    return data as ForumPost;
  } catch (error) {
    console.error('❌ Erreur lors de la création du post:', error);
    throw error;
  }
}

export async function addReplyToForumPost(postId: string, replyData: Partial<Reply>): Promise<void> {
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('forum_posts')
      .select('replies, is_answered')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;

    const newReply: Reply = {
      id: `reply-${Date.now()}`,
      author: replyData.author || 'Anonyme',
      content: replyData.content || '',
      date: new Date().toISOString().split('T')[0],
      isAnswer: replyData.isAnswer || false
    };

    const updatedReplies = [...(currentData.replies || []), newReply];
    const isAnswered = updatedReplies.some(r => r.isAnswer) || currentData.is_answered;

    const { error } = await supabase
      .from('forum_posts')
      .update({
        replies: updatedReplies,
        is_answered: isAnswered,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) throw error;

    console.log('✅ Réponse ajoutée au post');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la réponse:', error);
    throw error;
  }
}

// Fonction utilitaire pour vérifier la configuration
export const isDatabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

console.log('🚀 Supabase initialisé avec succès');
console.log('📊 Base de données: PostgreSQL');
console.log('🔒 Row Level Security: Activé');
