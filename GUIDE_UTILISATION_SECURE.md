# 🚀 Guide d'utilisation - Application Sécurisée

## ✅ Tout est prêt ! Voici comment utiliser votre application

---

## 🎯 **Sur votre machine Windows**

### **1. Lancer le serveur sécurisé**

```powershell
# Dans PowerShell, à la racine du projet
cd C:\Github\Stocks
npm run start:secure
```

Vous devriez voir :
```
🚀 Serveur sécurisé démarré sur http://localhost:3000
✅ Sessions httpOnly (2h timeout)
✅ Bcrypt pour mots de passe
✅ Rate limiting (5 login attempts / 15min)
...
```

### **2. Ouvrir le navigateur**

Ouvrez : **http://localhost:3000/login-secure.html**

### **3. Se connecter**

- **Username** : `admin`
- **Password** : `admin`

Cliquez sur **"Se connecter"**

### **4. Vous êtes redirigé automatiquement !**

Vous arrivez sur **`index-secure.html`** avec :
- ✅ **Toutes vos données** (18 articles)
- ✅ **Toutes les fonctionnalités**
- ✅ **Sécurité maximale**

---

## 🎉 **Fonctionnalités disponibles**

### ✅ **Tout ce qui existait avant**

- 📦 Gestion des articles (CRUD complet)
- 📊 Statistiques et graphiques
- 🔍 Recherche avancée
- 🔧 Gestion des maintenances
- 👥 Gestion des utilisateurs
- 📥 Import/Export CSV
- 💾 Backup/Restore
- 🏷️ QR Codes et étiquettes
- 📄 Rapports imprimables

### ✨ **+ Nouvelles sécurités**

- 🔐 **Sessions httpOnly** - Protection XSS
- 🔒 **Bcrypt** - Mots de passe ultra-sécurisés
- 🚫 **Rate limiting** - Protection brute-force
- ✅ **Validation serveur** - Protection injections
- 📋 **Audit logs** - Traçabilité complète

---

## 🔐 **Changer le mot de passe admin**

**IMPORTANT** : Changez le mot de passe par défaut !

### Via l'interface (TODO - à implémenter)

Mon Profil → Changer le mot de passe

### Via l'API (pour l'instant)

```powershell
# Ouvrir un nouveau PowerShell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Se connecter
$loginBody = @{
    username = "admin"
    password = "admin"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -SessionVariable session

# Changer le mot de passe
$changeBody = @{
    currentPassword = "admin"
    newPassword = "VotreNouveauMotDePasseSecurise123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/change-password" `
    -Method POST `
    -Body $changeBody `
    -ContentType "application/json" `
    -WebSession $session
```

---

## 📊 **Vos données**

Toutes vos données sont **intactes** :

- ✅ **18 articles** dans la base
- ✅ Dell Latitude 5520 (6 unités)
- ✅ HP EliteBook 840 (12 unités)  
- ✅ Lenovo ThinkPad X1 (2 unités)
- ✅ + 15 autres articles

**Emplacement** : `inventory.db` (SQLite)

---

## 🆚 **Différence avec l'ancienne version**

| Aspect | Ancienne (`npm start`) | Nouvelle (`npm run start:secure`) |
|--------|------------------------|-----------------------------------|
| **Fichiers** | `index.html` + `login.html` | `index-secure.html` + `login-secure.html` |
| **Authentification** | localStorage (vulnérable) | Sessions serveur (sécurisé) |
| **Mots de passe** | SHA256 | Bcrypt (10 rounds) |
| **Protection brute-force** | ❌ Non | ✅ Oui (5 tentatives max) |
| **Validation** | Client uniquement | Client + Serveur |
| **Audit logs** | localStorage (1000 max) | Base de données (illimité) |

---

## 🐛 **Résolution de problèmes**

### **Problème : "Cannot GET /index-secure.html"**

**Solution** : Vous essayez d'accéder directement à `/index-secure.html`.

✅ **Bon chemin** : Allez d'abord sur `/login-secure.html` et connectez-vous.

---

### **Problème : "Aucune donnée affichée"**

**Causes possibles** :

1. **Pas connecté** → Allez sur `/login-secure.html`
2. **Mauvais serveur** → Utilisez `npm run start:secure` (pas `npm start`)
3. **Cache navigateur** → Ctrl+Shift+R pour rafraîchir

**Vérification** :

```powershell
# Tester l'API (doit demander authentification)
curl http://localhost:3000/api/items
# Résultat attendu : {"error":"Non authentifié..."}
```

---

### **Problème : "Trop de tentatives de connexion"**

Vous avez été bloqué après 5 tentatives échouées.

**Solution** : Attendez 15 minutes OU réinitialisez manuellement :

```powershell
# Lancer node
node

# Dans le REPL Node :
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./inventory.db');
db.run('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE username = "admin"');
db.close();
```

---

## 📁 **Architecture de l'application**

```
Stocks/
├── server-secure.js         ← Serveur sécurisé (bcrypt, rate limit, etc.)
├── login-secure.html        ← Page de connexion sécurisée
├── index-secure.html        ← Application principale sécurisée
├── auth-check-secure.js     ← Vérification session avant chargement
├── script.js                ← Code JavaScript (inchangé)
├── styles.css               ← Styles (inchangé)
└── inventory.db             ← Base de données (vos 18 articles)
```

---

## 🚀 **Commandes disponibles**

```powershell
# Ancienne version (fonctionne toujours)
npm start

# Nouvelle version sécurisée
npm run start:secure

# Développement avec auto-reload
npm run dev:secure
```

---

## ✅ **Checklist de vérification**

- [ ] Serveur lancé avec `npm run start:secure`
- [ ] Navigateur sur `http://localhost:3000/login-secure.html`
- [ ] Connexion avec `admin` / `admin`
- [ ] Redirection automatique vers `index-secure.html`
- [ ] Mes 18 articles sont visibles
- [ ] J'ai changé le mot de passe admin

---

## 🎯 **Prochaines étapes recommandées**

1. ✅ **Utiliser l'application** et vérifier que tout fonctionne
2. ✅ **Changer le mot de passe admin** (sécurité)
3. ✅ **Créer d'autres utilisateurs** (Managers, Viewers)
4. ✅ **Faire un backup** de `inventory.db`
5. ✅ **Consulter les audit logs** pour voir l'activité

---

## 📞 **Support**

Si vous avez des problèmes :

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs du serveur (terminal PowerShell)
3. Consultez `MIGRATION_SECURITE.md` pour plus de détails

---

**🎉 Félicitations ! Votre application est maintenant ultra-sécurisée !**

*Dernière mise à jour : Novembre 2024*
