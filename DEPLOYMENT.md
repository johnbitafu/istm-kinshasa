# 🚀 Guide de Déploiement sur Netlify

Ce guide vous explique comment déployer votre application sur Netlify avec déploiement automatique.

## 📋 Prérequis

1. Un compte GitHub (gratuit)
2. Un compte Netlify (gratuit) - [netlify.com](https://www.netlify.com)
3. Votre code pushé sur un repository GitHub

---

## 🔧 Étape 1: Initialiser Git et Pousser sur GitHub

### 1.1 Initialiser Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Créer un Repository sur GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur le bouton **"+"** en haut à droite
3. Sélectionnez **"New repository"**
4. Nommez votre repository (ex: `istm-kinshasa-site`)
5. Laissez-le **public** ou **private** selon votre choix
6. **NE PAS** initialiser avec README, .gitignore ou license
7. Cliquez sur **"Create repository"**

### 1.3 Connecter et Pousser votre Code

```bash
# Remplacez YOUR_USERNAME et YOUR_REPO par vos informations
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 🌐 Étape 2: Déployer sur Netlify

### 2.1 Connecter votre Repository

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Cliquez sur **"Add new site"** > **"Import an existing project"**
3. Choisissez **"Deploy with GitHub"**
4. Autorisez Netlify à accéder à votre GitHub
5. Sélectionnez votre repository

### 2.2 Configuration du Build

Netlify devrait détecter automatiquement les paramètres grâce au fichier `netlify.toml`, mais vérifiez:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

Cliquez sur **"Deploy site"**

---

## 🔐 Étape 3: Configurer les Variables d'Environnement

### 3.1 Accéder aux Settings

1. Dans votre site Netlify, allez dans **"Site settings"**
2. Cliquez sur **"Environment variables"** dans le menu de gauche
3. Cliquez sur **"Add a variable"**

### 3.2 Ajouter les Variables Firebase

Ajoutez chacune de ces variables (copiez-les depuis votre fichier `.env` local):

```
VITE_FIREBASE_API_KEY=votre_valeur
VITE_FIREBASE_AUTH_DOMAIN=votre_valeur
VITE_FIREBASE_PROJECT_ID=votre_valeur
VITE_FIREBASE_STORAGE_BUCKET=votre_valeur
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_valeur
VITE_FIREBASE_APP_ID=votre_valeur
```

### 3.3 Redéployer

Après avoir ajouté les variables:
1. Allez dans **"Deploys"**
2. Cliquez sur **"Trigger deploy"** > **"Deploy site"**

---

## ✨ Étape 4: Déploiement Automatique Configuré!

### 🎉 C'est Fait!

Maintenant, **chaque fois que vous faites un commit** sur la branche `main`, Netlify:

1. ✅ Détecte automatiquement le changement
2. ✅ Lance le build (`npm run build`)
3. ✅ Déploie la nouvelle version
4. ✅ Met à jour votre site en live

### 🔄 Workflow de Développement

```bash
# 1. Modifiez votre code localement
# Exemple: éditez src/App.tsx

# 2. Commitez vos changements
git add .
git commit -m "Description de vos changements"

# 3. Poussez vers GitHub
git push origin main

# 4. Netlify déploie automatiquement (2-3 minutes)
# Vous recevrez une notification par email quand c'est prêt!
```

---

## 🌍 Étape 5: Configurer un Domaine Personnalisé (Optionnel)

### 5.1 Domaine Netlify Gratuit

Votre site est accessible via: `https://votre-site-name.netlify.app`

Pour personnaliser le nom:
1. Allez dans **"Site settings"** > **"Domain management"**
2. Cliquez sur **"Options"** > **"Edit site name"**
3. Choisissez un nom disponible (ex: `istm-kinshasa`)

### 5.2 Domaine Personnalisé

Si vous avez acheté un domaine (ex: `istm-kinshasa.com`):

1. Allez dans **"Domain management"**
2. Cliquez sur **"Add custom domain"**
3. Entrez votre domaine
4. Suivez les instructions pour configurer les DNS

---

## 🔍 Monitoring et Logs

### Voir les Déploiements

1. Allez dans l'onglet **"Deploys"**
2. Vous verrez:
   - ✅ Déploiements réussis (vert)
   - ⏳ En cours (jaune)
   - ❌ Échecs (rouge)

### Voir les Logs

Cliquez sur un déploiement pour voir:
- Les logs de build
- Les erreurs éventuelles
- Le temps de déploiement

---

## 🚨 Dépannage

### Problème: Build échoue

**Solution**: Vérifiez les logs dans Netlify
- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que les variables d'environnement sont bien configurées

### Problème: Site blanc ou erreurs

**Solution**:
1. Vérifiez la console du navigateur (F12)
2. Vérifiez que les variables d'environnement Firebase sont correctes
3. Assurez-vous que Firebase autorise votre domaine Netlify

### Problème: Changements non visibles

**Solution**:
1. Videz le cache du navigateur (Ctrl+Shift+R)
2. Vérifiez que le déploiement est terminé dans Netlify
3. Attendez 1-2 minutes pour la propagation

---

## 📊 Fonctionnalités Netlify Incluses

✅ **Déploiement automatique** depuis GitHub
✅ **HTTPS automatique** avec certificat SSL gratuit
✅ **CDN global** pour des performances optimales
✅ **Preview deploys** pour les pull requests
✅ **Rollback** facile vers versions précédentes
✅ **Analytics** (optionnel, payant)

---

## 🎯 Commandes Utiles

```bash
# Tester le build localement avant de pusher
npm run build
npm run preview

# Voir le statut Git
git status

# Créer une nouvelle branche pour tester
git checkout -b ma-nouvelle-feature
git push origin ma-nouvelle-feature

# Revenir à main
git checkout main
```

---

## 📝 Notes Importantes

1. **Ne committez JAMAIS le fichier `.env`** - Il est dans `.gitignore`
2. **Toujours tester localement** avant de pusher
3. **Les variables d'environnement** doivent être configurées dans Netlify
4. **Chaque push sur `main`** déclenche un déploiement
5. **Les branches autres que `main`** créent des preview deploys

---

## 🆘 Support

- Documentation Netlify: [docs.netlify.com](https://docs.netlify.com)
- Forum Netlify: [answers.netlify.com](https://answers.netlify.com)
- Status Netlify: [www.netlifystatus.com](https://www.netlifystatus.com)

---

## ✅ Checklist de Déploiement

- [ ] Code pushé sur GitHub
- [ ] Repository connecté à Netlify
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Site accessible via URL Netlify
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Test de déploiement automatique fonctionnel

---

**🎉 Félicitations! Votre site est maintenant en ligne et se met à jour automatiquement!**
