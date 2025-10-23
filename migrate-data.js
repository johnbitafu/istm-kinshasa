import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDx5pczXRwKtPh0clhKycA_prnu9P2lT6w",
  authDomain: "istm-kin.firebaseapp.com",
  projectId: "istm-kin",
  storageBucket: "istm-kin.firebasestorage.app",
  messagingSenderId: "631252657421",
  appId: "1:631252657421:web:c438b91d4c3238aaebbc44"
};

// Configuration Supabase
const supabaseUrl = "https://ckwancoyewyzvzjxplxr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2FuY295ZXd5enZ6anhwbHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzA0MzEsImV4cCI6MjA3NjcwNjQzMX0.TL5DxGkFarIKlJokkUSLPYvzrutSiH9T8LbGv5p7abA";

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialiser Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Démarrage de la migration des données...\n');

async function migrateForms() {
  console.log('📋 Migration des formulaires...');
  try {
    const snapshot = await getDocs(collection(db, 'forms'));
    const forms = [];

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

    if (forms.length > 0) {
      const { data, error } = await supabase
        .from('forms')
        .insert(forms);

      if (error) {
        console.error('❌ Erreur lors de l\'insertion des formulaires:', error);
      } else {
        console.log(`✅ ${forms.length} formulaire(s) migré(s)`);
      }
    } else {
      console.log('ℹ️  Aucun formulaire à migrer');
    }

    return forms.length;
  } catch (error) {
    console.error('❌ Erreur migration formulaires:', error);
    return 0;
  }
}

async function migrateSubmissions() {
  console.log('\n📝 Migration des soumissions...');
  try {
    const snapshot = await getDocs(collection(db, 'form_submissions'));
    const submissions = [];

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

    if (submissions.length > 0) {
      // Insérer par lots de 100 pour éviter les erreurs
      const batchSize = 100;
      let migrated = 0;

      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('form_submissions')
          .insert(batch);

        if (error) {
          console.error(`❌ Erreur lot ${i}-${i + batch.length}:`, error.message);
        } else {
          migrated += batch.length;
          console.log(`✅ ${migrated}/${submissions.length} soumissions migrées`);
        }
      }

      console.log(`✅ Total: ${migrated} soumission(s) migrée(s)`);
      return migrated;
    } else {
      console.log('ℹ️  Aucune soumission à migrer');
      return 0;
    }
  } catch (error) {
    console.error('❌ Erreur migration soumissions:', error);
    return 0;
  }
}

async function migrateEvents() {
  console.log('\n📅 Migration des événements...');
  try {
    const snapshot = await getDocs(collection(db, 'events'));
    const events = [];

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

    if (events.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .insert(events);

      if (error) {
        console.error('❌ Erreur lors de l\'insertion des événements:', error);
      } else {
        console.log(`✅ ${events.length} événement(s) migré(s)`);
      }
    } else {
      console.log('ℹ️  Aucun événement à migrer');
    }

    return events.length;
  } catch (error) {
    console.error('❌ Erreur migration événements:', error);
    return 0;
  }
}

async function migrateContent() {
  console.log('\n📸 Migration du contenu...');
  try {
    const snapshot = await getDocs(collection(db, 'content_items'));
    const items = [];

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

    if (items.length > 0) {
      const { data, error } = await supabase
        .from('content_items')
        .insert(items);

      if (error) {
        console.error('❌ Erreur lors de l\'insertion du contenu:', error);
      } else {
        console.log(`✅ ${items.length} élément(s) de contenu migré(s)`);
      }
    } else {
      console.log('ℹ️  Aucun contenu à migrer');
    }

    return items.length;
  } catch (error) {
    console.error('❌ Erreur migration contenu:', error);
    return 0;
  }
}

async function migrateForumPosts() {
  console.log('\n💬 Migration du forum...');
  try {
    const snapshot = await getDocs(collection(db, 'forum_posts'));
    const posts = [];

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

    if (posts.length > 0) {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert(posts);

      if (error) {
        console.error('❌ Erreur lors de l\'insertion des posts:', error);
      } else {
        console.log(`✅ ${posts.length} post(s) migré(s)`);
      }
    } else {
      console.log('ℹ️  Aucun post à migrer');
    }

    return posts.length;
  } catch (error) {
    console.error('❌ Erreur migration forum:', error);
    return 0;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Vérification des données migrées...\n');

  const tables = ['forms', 'form_submissions', 'events', 'content_items', 'forum_posts'];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ ${table}: Erreur`);
    } else {
      console.log(`✅ ${table}: ${count} ligne(s)`);
    }
  }
}

async function migrate() {
  const startTime = Date.now();

  try {
    const stats = {
      forms: await migrateForms(),
      submissions: await migrateSubmissions(),
      events: await migrateEvents(),
      content: await migrateContent(),
      forum: await migrateForumPosts()
    };

    await verifyMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log(`⏱️  Durée: ${duration}s`);
    console.log(`📊 Statistiques:`);
    console.log(`   - Formulaires: ${stats.forms}`);
    console.log(`   - Soumissions: ${stats.submissions}`);
    console.log(`   - Événements: ${stats.events}`);
    console.log(`   - Contenu: ${stats.content}`);
    console.log(`   - Forum: ${stats.forum}`);
    console.log(`   - Total: ${Object.values(stats).reduce((a, b) => a + b, 0)} entrées`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error);
    process.exit(1);
  }
}

// Lancer la migration
migrate().then(() => {
  console.log('\n✅ Migration complète!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
