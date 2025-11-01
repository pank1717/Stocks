# Application de Gestion de Stock IT - Avec Authentification Azure AD

## Vue d'ensemble

Cette version ajoute l'authentification Microsoft (Azure AD) à votre application de gestion de stock.

## Avantages

✅ **Single Sign-On (SSO)** - Les utilisateurs se connectent avec leur compte Microsoft
✅ **Sécurité renforcée** - Pas de gestion de mots de passe
✅ **Intégration M365** - Utilise les comptes existants
✅ **Audit** - Savoir qui a fait quoi (email dans l'historique)
✅ **Permissions** - Contrôle d'accès centralisé

## Fichiers ajoutés

| Fichier | Description |
|---------|-------------|
| `server-auth.js` | Serveur avec authentification Azure AD |
| `login.html` | Page de connexion avec bouton Microsoft |
| `index-auth.html` | Page principale avec profil utilisateur |
| `styles-auth.css` | Styles pour le profil utilisateur |
| `script-auth.js` | Chargement du profil et gestion de session |
| `.env.example` | Template de configuration |
| `AZURE_AD_CONFIG.md` | Guide complet de configuration Azure |

## Installation

### Étape 1 : Configuration Azure AD (30 min)

Suivez le guide complet `AZURE_AD_CONFIG.md` pour :
1. Créer une app registration dans Azure Portal
2. Obtenir Client ID, Client Secret, Tenant ID
3. Configurer les URIs de redirection
4. Définir les permissions

### Étape 2 : Configuration de l'application (5 min)

1. **Copiez le fichier de configuration** :
   ```bash
   cp .env.example .env
   ```

2. **Modifiez le fichier `.env`** avec vos valeurs Azure :
   ```env
   AZURE_AD_CLIENT_ID=votre-client-id
   AZURE_AD_CLIENT_SECRET=votre-client-secret
   AZURE_AD_TENANT_ID=votre-tenant-id
   SESSION_SECRET=un-secret-aleatoire-tres-long
   ```

3. **Générez un SESSION_SECRET** :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Étape 3 : Installer les dépendances (2 min)

```bash
npm install dotenv passport passport-azure-ad express-session
```

### Étape 4 : Démarrer l'application (1 min)

**Avec authentification** :
```bash
node server-auth.js
```

**Sans authentification** (version originale) :
```bash
node server.js
```

### Étape 5 : Accéder à l'application

Ouvrez votre navigateur : `http://localhost:3000`

Vous serez automatiquement redirigé vers la page de connexion Microsoft.

## Utilisation

### Connexion

1. Accédez à `http://localhost:3000`
2. Cliquez sur **"Se connecter avec Microsoft"**
3. Connectez-vous avec votre compte Microsoft (M365)
4. Acceptez les permissions (première fois)
5. Vous êtes redirigé vers l'application

### Déconnexion

Cliquez sur le bouton **"Déconnexion"** dans le header (en haut à droite)

### Profil utilisateur

Votre nom et email s'affichent automatiquement dans le header.

## Fonctionnalités supplémentaires

### Traçabilité

Tous les mouvements de stock enregistrent maintenant l'email de l'utilisateur :

```sql
SELECT * FROM stock_history;
```

Résultat :
```
id | item_id | type | quantity | user_email | date
1  | 123     | add  | 5        | jean.dupont@entreprise.com | 2024-01-15
```

### Protection des routes

Toutes les routes API sont automatiquement protégées :
- `/api/items` - Liste des articles
- `/api/items/:id` - Détails d'un article
- `/api/items` (POST) - Créer un article
- `/api/items/:id` (PUT) - Modifier un article
- `/api/items/:id` (DELETE) - Supprimer un article
- `/api/items/:id/adjust` - Ajuster le stock
- `/api/statistics` - Statistiques

**Sans authentification → Erreur 401 Unauthorized**

## Architecture

```
┌─────────────┐
│ Utilisateur │
└──────┬──────┘
       │ 1. Accède à http://localhost:3000
       ↓
┌──────────────────┐
│  server-auth.js  │
│ Vérifie session  │
└──────┬───────────┘
       │ Pas de session ?
       ↓
┌──────────────────┐
│   /login page    │
│ Bouton Microsoft │
└──────┬───────────┘
       │ 2. Clic "Se connecter"
       ↓
┌──────────────────┐
│   Azure AD       │
│ login.microsoft  │
└──────┬───────────┘
       │ 3. Utilisateur entre ses identifiants
       ↓
┌──────────────────┐
│   Azure AD       │
│ Vérifie & génère │
│     token        │
└──────┬───────────┘
       │ 4. Redirige vers /auth/redirect
       ↓
┌──────────────────┐
│  server-auth.js  │
│ Passport vérifie │
│ Crée session     │
└──────┬───────────┘
       │ 5. Redirige vers /
       ↓
┌──────────────────┐
│ index-auth.html  │
│ + script-auth.js │
│ Charge profil    │
└──────────────────┘
```

## Configuration en production

### Variables d'environnement

Sur votre serveur de production, configurez :

```env
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
APP_URL=https://votre-domaine.com
REDIRECT_URI=https://votre-domaine.com/auth/redirect
SESSION_SECRET=...
NODE_ENV=production
PORT=3000
```

### HTTPS obligatoire

⚠️ **Important** : En production, vous DEVEZ utiliser HTTPS !

Azure AD n'accepte pas les redirections HTTP en production.

### Ajouter l'URI de production dans Azure

1. Azure Portal → App registrations → Votre app
2. Authentication → Platform configurations → Web
3. Add URI : `https://votre-domaine.com/auth/redirect`
4. Save

## Permissions et rôles (Avancé)

### Restreindre l'accès

Par défaut, tous les utilisateurs de votre organisation peuvent se connecter.

Pour restreindre :
1. Azure Portal → Enterprise applications → Votre app
2. Properties → "Assignment required?" → **Yes**
3. Users and groups → Add user/group
4. Sélectionnez les utilisateurs autorisés

### Ajouter des rôles

Pour différencier Admin / Contributeur / Lecteur :

1. Azure Portal → App registrations → Votre app
2. App roles → Create app role
3. Définissez les rôles (ex: Admin, Contributeur, Lecteur)
4. Assignez les rôles aux utilisateurs
5. Dans le code, utilisez `req.user.roles`

Exemple :
```javascript
// Vérifier si l'utilisateur est admin
function isAdmin(req) {
    return req.user.roles && req.user.roles.includes('Admin');
}

// Protéger une route
app.delete('/api/items/:id', ensureAuthenticated, (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    // ... supprimer l'article
});
```

## Dépannage

### Erreur : "AADSTS50011: The reply URL does not match"

**Cause** : L'URI de redirection ne correspond pas

**Solution** :
1. Vérifiez `REDIRECT_URI` dans `.env`
2. Vérifiez l'URI dans Azure Portal (Authentication)
3. Assurez-vous qu'elles sont IDENTIQUES (http vs https, trailing slash, etc.)

### Erreur : "AADSTS700016: Application not found"

**Cause** : Le Client ID est incorrect

**Solution** :
1. Vérifiez `AZURE_AD_CLIENT_ID` dans `.env`
2. Comparez avec l'Application ID dans Azure Portal → Overview

### Erreur : "AADSTS7000215: Invalid client secret"

**Cause** : Le secret est incorrect ou expiré

**Solution** :
1. Vérifiez `AZURE_AD_CLIENT_SECRET` dans `.env`
2. Si expiré, créez un nouveau secret dans Azure Portal

### La session se déconnecte tout le temps

**Cause** : Problème de cookies

**Solutions** :
1. En développement : Vérifiez que `NODE_ENV` n'est pas `production`
2. En production : Assurez-vous d'utiliser HTTPS
3. Vérifiez que le `SESSION_SECRET` n'a pas changé

### Erreur : "User not assigned to the application"

**Cause** : L'utilisateur n'est pas autorisé

**Solution** :
1. Azure Portal → Enterprise applications → Votre app
2. Users and groups → Add user/group
3. Ajoutez l'utilisateur

## Comparaison des versions

| Fonctionnalité | Sans auth (`server.js`) | Avec auth (`server-auth.js`) |
|----------------|------------------------|------------------------------|
| **Connexion** | Aucune | Microsoft Azure AD |
| **Sécurité** | Aucune | Protection complète |
| **Profil utilisateur** | Non | Oui (nom, email) |
| **Traçabilité** | Non | Oui (email dans historique) |
| **Permissions** | Non | Oui (via Azure AD) |
| **Installation** | Immédiate | +30 min config Azure |
| **Coût** | Gratuit | Gratuit (avec M365) |

## Package.json mis à jour

Ajoutez ces scripts dans `package.json` :

```json
{
  "scripts": {
    "start": "node server.js",
    "start:auth": "node server-auth.js",
    "dev": "nodemon server.js",
    "dev:auth": "nodemon server-auth.js"
  }
}
```

Utilisation :
```bash
npm run start:auth    # Version avec authentification
npm start             # Version sans authentification
```

## Migration de données

Vos données existantes (inventory.db) sont compatibles.

La seule différence : la table `stock_history` a un nouveau champ `user_email` (optionnel).

## Sécurité

### ✅ À faire

- ✅ Utilisez HTTPS en production
- ✅ Ne committez JAMAIS le fichier `.env`
- ✅ Changez le `SESSION_SECRET` régulièrement
- ✅ Limitez l'accès aux utilisateurs autorisés
- ✅ Surveillez les connexions dans Azure AD
- ✅ Renouvelez le Client Secret avant expiration

### ❌ À éviter

- ❌ Ne partagez jamais votre `CLIENT_SECRET`
- ❌ N'utilisez pas HTTP en production
- ❌ Ne désactivez pas les permissions requises
- ❌ Ne stockez pas les secrets dans le code

## Support

- [Documentation Azure AD](https://docs.microsoft.com/azure/active-directory/develop/)
- [Passport Azure AD](https://github.com/AzureAD/passport-azure-ad)
- [Express Session](https://github.com/expressjs/session)

## Migration depuis la version sans auth

### Étape 1 : Sauvegardez vos données

```bash
cp inventory.db inventory.db.backup
```

### Étape 2 : Installez les dépendances

```bash
npm install dotenv passport passport-azure-ad express-session
```

### Étape 3 : Configurez Azure AD

Suivez `AZURE_AD_CONFIG.md`

### Étape 4 : Créez `.env`

```bash
cp .env.example .env
# Éditez .env avec vos valeurs
```

### Étape 5 : Démarrez avec authentification

```bash
npm run start:auth
```

Vos données sont conservées, et l'authentification est maintenant active!

---

**Prêt à ajouter l'authentification ?** Suivez `AZURE_AD_CONFIG.md` pour configurer Azure AD en 30 minutes!
