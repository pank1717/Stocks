# Configuration Azure AD - Guide complet

## Vue d'ensemble

Ce guide vous permet d'ajouter l'authentification Microsoft (Azure AD) à votre application de gestion de stock.

## Avantages

✅ **Single Sign-On (SSO)** - Les utilisateurs se connectent avec leur compte Microsoft
✅ **Sécurité** - Pas besoin de gérer les mots de passe
✅ **Intégration** - Utilise les comptes Microsoft 365 existants
✅ **Permissions** - Contrôle qui peut accéder à l'application
✅ **Profil utilisateur** - Nom, email, photo automatiquement disponibles

## Prérequis

- Compte Azure (gratuit) : [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/)
- Droits d'administrateur Azure AD (ou demander à votre admin IT)
- Application web déployée avec une URL accessible

## Partie 1 : Enregistrement de l'application dans Azure AD

### Étape 1 : Accéder au portail Azure

1. Allez sur [https://portal.azure.com](https://portal.azure.com)
2. Connectez-vous avec votre compte Microsoft
3. Dans la barre de recherche, tapez **"Azure Active Directory"** ou **"Microsoft Entra ID"**
4. Cliquez sur le service

### Étape 2 : Créer l'enregistrement d'application

1. Dans le menu gauche, cliquez sur **"App registrations"** (Inscriptions d'applications)
2. Cliquez sur **"+ New registration"** (+ Nouvelle inscription)

3. Remplissez le formulaire :

   **Nom** : `Gestion Stock IT`

   **Types de comptes pris en charge** :
   - Sélectionnez **"Accounts in this organizational directory only"** (Comptes dans cet annuaire d'organisation uniquement)
   - Ou **"Accounts in any organizational directory"** si vous voulez permettre d'autres organisations

   **URI de redirection** :
   - Type : **Web**
   - URL : `http://localhost:3000/auth/redirect` (pour le développement local)
   - Note : Vous ajouterez l'URL de production plus tard

4. Cliquez sur **"Register"** (Inscrire)

### Étape 3 : Configurer l'application

#### 3.1 Noter les informations importantes

Sur la page "Overview" de votre application, notez :

- **Application (client) ID** : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID** : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

⚠️ **Important** : Vous aurez besoin de ces valeurs pour configurer l'application.

#### 3.2 Créer un secret client

1. Dans le menu gauche, cliquez sur **"Certificates & secrets"** (Certificats et secrets)
2. Cliquez sur **"+ New client secret"** (+ Nouveau secret client)
3. Description : `Gestion Stock Secret`
4. Expiration : Choisissez **24 mois** (recommandé)
5. Cliquez sur **"Add"** (Ajouter)
6. **⚠️ IMPORTANT** : Copiez immédiatement la **Value** (Valeur) du secret
   - Elle ne sera plus visible après !
   - Format : `xxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 3.3 Configurer les permissions API

1. Dans le menu gauche, cliquez sur **"API permissions"** (Autorisations de l'API)
2. Vérifiez que ces permissions sont présentes (ajoutées automatiquement) :
   - Microsoft Graph → User.Read (Delegated)

3. Si vous voulez lire les photos de profil, ajoutez :
   - Cliquez sur **"+ Add a permission"**
   - **Microsoft Graph** → **Delegated permissions**
   - Cherchez et cochez **"User.ReadBasic.All"**
   - Cliquez sur **"Add permissions"**

4. Cliquez sur **"Grant admin consent for [votre organisation]"**
   - Cliquez sur **"Yes"**
   - ⚠️ Nécessite des droits admin

#### 3.4 Configurer l'authentification

1. Dans le menu gauche, cliquez sur **"Authentication"**
2. Sous **"Platform configurations"** → **"Web"**, vérifiez votre URI de redirection

3. Ajoutez l'URL de production (si déployée) :
   - Cliquez sur **"Add URI"**
   - Ajoutez : `https://votre-domaine.com/auth/redirect`

4. Sous **"Implicit grant and hybrid flows"** :
   - ✅ Cochez **"ID tokens"** (pour OpenID Connect)

5. Cliquez sur **"Save"** (Enregistrer)

#### 3.5 Ajouter une URI de déconnexion (optionnel)

1. Toujours dans **"Authentication"**
2. Sous **"Front-channel logout URL"** :
   - Ajoutez : `http://localhost:3000/logout`
   - Et : `https://votre-domaine.com/logout` (production)

3. Cliquez sur **"Save"**

### Étape 4 : Configurer les utilisateurs autorisés (optionnel)

Par défaut, tous les utilisateurs de votre organisation peuvent se connecter.

Pour restreindre l'accès à certains utilisateurs :

1. Retournez à **"Azure Active Directory"**
2. Cliquez sur **"Enterprise applications"**
3. Trouvez et cliquez sur **"Gestion Stock IT"**
4. Dans le menu gauche, cliquez sur **"Properties"**
5. **"Assignment required?"** : Passez à **Yes**
6. Cliquez sur **"Save"**

7. Dans le menu gauche, cliquez sur **"Users and groups"**
8. Cliquez sur **"+ Add user/group"**
9. Sélectionnez les utilisateurs autorisés
10. Cliquez sur **"Assign"**

## Partie 2 : Configuration de l'application

### Étape 1 : Créer le fichier de configuration

Créez un fichier `.env` à la racine de votre projet :

```env
# Configuration Azure AD
AZURE_AD_CLIENT_ID=votre-client-id-ici
AZURE_AD_CLIENT_SECRET=votre-client-secret-ici
AZURE_AD_TENANT_ID=votre-tenant-id-ici

# URL de l'application
APP_URL=http://localhost:3000

# URL de redirection après login
REDIRECT_URI=http://localhost:3000/auth/redirect

# Session secret (générez une chaîne aléatoire)
SESSION_SECRET=votre-secret-de-session-tres-long-et-aleatoire

# Port (optionnel)
PORT=3000
```

### Étape 2 : Générer un SESSION_SECRET

Option 1 - Node.js :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Option 2 - En ligne :
Allez sur [https://www.uuidgenerator.net/](https://www.uuidgenerator.net/)

### Étape 3 : Remplacer les valeurs

Remplacez dans le fichier `.env` :
- `AZURE_AD_CLIENT_ID` → Application (client) ID de l'Étape 3.1
- `AZURE_AD_CLIENT_SECRET` → Secret de l'Étape 3.2
- `AZURE_AD_TENANT_ID` → Directory (tenant) ID de l'Étape 3.1
- `SESSION_SECRET` → Secret généré à l'Étape 2

### Étape 4 : Installer les dépendances

```bash
npm install dotenv passport passport-azure-ad express-session
```

### Étape 5 : Démarrer l'application

```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## Partie 3 : Déploiement en production

### Étape 1 : Configurer les variables d'environnement

Sur votre serveur de production, configurez les mêmes variables d'environnement :

```env
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
APP_URL=https://votre-domaine.com
REDIRECT_URI=https://votre-domaine.com/auth/redirect
SESSION_SECRET=...
PORT=3000
```

### Étape 2 : Ajouter l'URI de redirection dans Azure

1. Retournez dans Azure Portal → App registrations
2. Cliquez sur votre application
3. **Authentication** → **Platform configurations** → **Web**
4. Cliquez sur **"Add URI"**
5. Ajoutez : `https://votre-domaine.com/auth/redirect`
6. Cliquez sur **"Save"**

### Étape 3 : Tester la connexion

1. Allez sur `https://votre-domaine.com`
2. Cliquez sur **"Se connecter avec Microsoft"**
3. Connectez-vous avec votre compte Microsoft
4. Vous devriez être redirigé vers l'application

## Sécurité et bonnes pratiques

### ✅ À faire

- ✅ Utilisez HTTPS en production (obligatoire)
- ✅ Ne committez JAMAIS le fichier `.env` sur Git
- ✅ Changez le `SESSION_SECRET` régulièrement
- ✅ Limitez l'accès aux utilisateurs autorisés
- ✅ Surveillez les connexions dans Azure AD

### ❌ À éviter

- ❌ Ne partagez jamais votre `CLIENT_SECRET`
- ❌ N'utilisez pas HTTP en production
- ❌ Ne désactivez pas les permissions requises
- ❌ N'oubliez pas de renouveler le secret avant expiration

## Dépannage

### Erreur : "AADSTS50011: The reply URL does not match"

**Solution** : L'URI de redirection dans Azure ne correspond pas
1. Vérifiez l'URI dans Azure Portal (Authentication)
2. Vérifiez que `REDIRECT_URI` dans `.env` est identique
3. Vérifiez l'orthographe (http vs https, trailing slash, etc.)

### Erreur : "AADSTS700016: Application not found"

**Solution** : Le Client ID est incorrect
1. Vérifiez `AZURE_AD_CLIENT_ID` dans `.env`
2. Comparez avec l'Application ID dans Azure Portal

### Erreur : "AADSTS7000215: Invalid client secret"

**Solution** : Le secret client est incorrect ou expiré
1. Vérifiez `AZURE_AD_CLIENT_SECRET` dans `.env`
2. Créez un nouveau secret si expiré (Étape 3.2)

### Erreur : "User not assigned to the application"

**Solution** : L'utilisateur n'est pas autorisé
1. Azure Portal → Enterprise applications → Votre app
2. Users and groups → Ajoutez l'utilisateur

### La session se déconnecte tout le temps

**Solution** : Problème de cookies
1. Vérifiez que vous utilisez HTTPS en production
2. Vérifiez la configuration des cookies dans `server-auth.js`

## Architecture de l'authentification

```
┌─────────────┐
│  Utilisateur│
└──────┬──────┘
       │ 1. Accède à l'app
       ↓
┌─────────────────┐
│ Application Web │
│  (Non connecté) │
└────────┬────────┘
         │ 2. Redirige vers
         ↓
┌─────────────────┐
│   Azure AD      │
│ Page de login   │
└────────┬────────┘
         │ 3. Utilisateur se connecte
         ↓
┌─────────────────┐
│   Azure AD      │
│ Vérifie & génère│
│     token       │
└────────┬────────┘
         │ 4. Redirige avec token
         ↓
┌─────────────────┐
│ Application Web │
│ Vérifie token   │
│ Crée session    │
└────────┬────────┘
         │ 5. Utilisateur connecté
         ↓
┌─────────────────┐
│   Dashboard     │
│  (Connecté)     │
└─────────────────┘
```

## Flux d'authentification

1. **Accès initial** : L'utilisateur va sur votre site
2. **Redirection** : Pas de session → Redirigé vers Azure AD
3. **Login Microsoft** : L'utilisateur entre ses identifiants Microsoft
4. **Validation** : Azure AD valide et renvoie un token
5. **Session** : Votre app crée une session avec les infos utilisateur
6. **Accès** : L'utilisateur accède à l'application

## Informations utilisateur disponibles

Après connexion, vous aurez accès à :

```javascript
req.user = {
  oid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  // ID unique
  name: "Jean Dupont",                           // Nom complet
  preferred_username: "jean.dupont@entreprise.com", // Email
  email: "jean.dupont@entreprise.com",           // Email
  // ... autres informations du profil
}
```

## Permissions et rôles (Avancé)

Pour ajouter des rôles (admin, utilisateur, lecteur) :

1. Azure Portal → App registrations → Votre app
2. **App roles** → **+ Create app role**
3. Définissez les rôles (ex: Admin, Contributeur, Lecteur)
4. Assignez les rôles aux utilisateurs
5. Utilisez `req.user.roles` dans votre code

## Support

- [Documentation Microsoft Identity Platform](https://docs.microsoft.com/azure/active-directory/develop/)
- [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/) (pour clients externes)
- [Passport Azure AD](https://github.com/AzureAD/passport-azure-ad)

---

**Prêt pour la configuration ?** Suivez les étapes dans l'ordre et vous aurez l'authentification Microsoft en 30 minutes!
