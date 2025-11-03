# 📦 Guide d'installation - Gestion de Stock IT

Ce guide vous aidera à installer et configurer l'application de gestion de stock IT sur un nouveau PC.

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### 1. Node.js (version 14 ou supérieure)

**Windows :**
- Téléchargez depuis : https://nodejs.org/
- Installez la version LTS (Long Term Support)
- Vérifiez l'installation :
  ```cmd
  node --version
  npm --version
  ```

**Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install nodejs npm
node --version
npm --version
```

**macOS :**
```bash
brew install node
node --version
npm --version
```

### 2. Git (optionnel, pour cloner le dépôt)

**Windows :**
- Téléchargez depuis : https://git-scm.com/
- Installez avec les options par défaut

**Linux :**
```bash
sudo apt install git
```

**macOS :**
```bash
brew install git
```

---

## 📥 Installation

### Méthode 1 : Clonage depuis Git (recommandé)

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/pank1717/Stocks.git
   cd Stocks
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

### Méthode 2 : Installation manuelle (sans Git)

1. **Télécharger l'application**
   - Téléchargez le fichier ZIP depuis GitHub
   - Extrayez dans un dossier de votre choix
   - Ouvrez un terminal dans ce dossier

2. **Installer les dépendances**
   ```bash
   npm install
   ```

---

## 🚀 Lancement de l'application

### Démarrage simple

```bash
node server.js
```

L'application sera accessible sur : **http://localhost:3000**

Vous devriez voir ce message :
```
Server running on http://localhost:3000
Database: /chemin/vers/inventory.db
Connected to SQLite database
Items table ready
Stock history table ready
```

---

## 🔐 Première connexion

### Compte administrateur par défaut

Lors de la première utilisation, connectez-vous avec :

- **Nom d'utilisateur :** `admin`
- **Mot de passe :** `admin`

⚠️ **IMPORTANT :** Changez immédiatement ce mot de passe après la première connexion !

### Changer le mot de passe

1. Cliquez sur **"👤 Mon Profil"** en haut à gauche
2. Remplissez le formulaire de changement de mot de passe
3. Utilisez un mot de passe fort (min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)

---

## 📁 Structure des fichiers

```
Stocks/
├── server.js              # Serveur Node.js/Express
├── index.html             # Interface principale
├── script.js              # Logique applicative
├── styles.css             # Styles CSS
├── package.json           # Dépendances npm
├── inventory.db           # Base de données SQLite (créée automatiquement)
├── INSTALLATION.md        # Ce fichier
└── README.md              # Documentation générale
```

---

## 🔄 Restauration d'une sauvegarde

Si vous avez une sauvegarde depuis une installation précédente :

1. Lancez l'application et connectez-vous
2. Cliquez sur **"💾 Sauvegarde"** (visible pour les administrateurs)
3. Cliquez sur **"📤 Choisir un fichier de sauvegarde"**
4. Sélectionnez votre fichier JSON de sauvegarde
5. Confirmez la restauration

⚠️ **Attention :** La restauration écrase toutes les données actuelles !

---

## 🖥️ Configuration en tant que service (optionnel)

Pour que l'application démarre automatiquement au démarrage du PC :

### Windows - Avec PM2

1. **Installer PM2 globalement**
   ```cmd
   npm install -g pm2
   pm2 install pm2-windows-startup
   pm2-startup install
   ```

2. **Démarrer l'application avec PM2**
   ```cmd
   pm2 start server.js --name "stock-management"
   pm2 save
   ```

3. **Commandes utiles**
   ```cmd
   pm2 list                    # Voir les applications
   pm2 stop stock-management   # Arrêter
   pm2 restart stock-management # Redémarrer
   pm2 logs stock-management   # Voir les logs
   ```

### Linux - Avec systemd

1. **Créer un fichier service**
   ```bash
   sudo nano /etc/systemd/system/stock-management.service
   ```

2. **Ajouter le contenu suivant** (adaptez les chemins) :
   ```ini
   [Unit]
   Description=Application Gestion de Stock IT
   After=network.target

   [Service]
   Type=simple
   User=votreuser
   WorkingDirectory=/chemin/vers/Stocks
   ExecStart=/usr/bin/node /chemin/vers/Stocks/server.js
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Activer et démarrer le service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable stock-management
   sudo systemctl start stock-management
   sudo systemctl status stock-management
   ```

---

## 🌐 Accès depuis d'autres ordinateurs du réseau

### 1. Modifier server.js

Changez cette ligne :
```javascript
const PORT = 3000;
```

Pour écouter sur toutes les interfaces :
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

### 2. Trouver l'adresse IP du serveur

**Windows :**
```cmd
ipconfig
```
Cherchez "IPv4 Address"

**Linux/macOS :**
```bash
ip addr show
# ou
ifconfig
```

### 3. Configurer le pare-feu

**Windows :**
```cmd
netsh advfirewall firewall add rule name="Stock Management" dir=in action=allow protocol=TCP localport=3000
```

**Linux (UFW) :**
```bash
sudo ufw allow 3000/tcp
```

### 4. Accès depuis un autre PC

Ouvrez un navigateur sur un autre PC du réseau et accédez à :
```
http://[IP_DU_SERVEUR]:3000
```

Par exemple : `http://192.168.1.100:3000`

---

## 🔒 Sécurité - Recommandations

### Pour une utilisation en production :

1. **Changez tous les mots de passe par défaut**
   - Utilisez des mots de passe forts et uniques

2. **Sauvegardez régulièrement**
   - Utilisez la fonction "💾 Sauvegarde"
   - Exportez et stockez les fichiers en lieu sûr

3. **Limitez l'accès réseau**
   - N'exposez pas le port 3000 sur Internet
   - Utilisez un VPN pour l'accès distant

4. **Mettez à jour régulièrement**
   ```bash
   git pull origin main
   npm install
   ```

5. **Surveillez les logs d'audit**
   - Consultez régulièrement le journal d'audit
   - Vérifiez les actions suspectes

---

## 🐛 Dépannage

### L'application ne démarre pas

**Erreur : "Port 3000 déjà utilisé"**
```bash
# Windows - Trouver et tuer le processus
netstat -ano | findstr :3000
taskkill /PID [numéro_pid] /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

**Erreur : "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

### La base de données est corrompue

1. Arrêtez l'application
2. Supprimez `inventory.db`
3. Relancez l'application (une nouvelle base sera créée)
4. Restaurez votre sauvegarde si disponible

### L'interface ne se charge pas

1. Vérifiez que le serveur est bien démarré
2. Essayez en navigation privée (Ctrl+Shift+N)
3. Videz le cache du navigateur (Ctrl+Shift+Delete)
4. Vérifiez la console du navigateur (F12)

---

## 📞 Support

Pour toute question ou problème :

1. Consultez les logs de l'application
2. Vérifiez les erreurs dans la console du navigateur (F12)
3. Consultez le journal d'audit dans l'application
4. Créez une issue sur GitHub si nécessaire

---

## 📚 Ressources supplémentaires

- **Documentation Node.js :** https://nodejs.org/docs/
- **Documentation Express :** https://expressjs.com/
- **Documentation SQLite :** https://www.sqlite.org/docs.html
- **Chart.js :** https://www.chartjs.org/docs/

---

## ✅ Checklist d'installation

- [ ] Node.js installé (version 14+)
- [ ] Dépendances npm installées
- [ ] Application lancée avec succès
- [ ] Connexion avec compte admin réussie
- [ ] Mot de passe admin changé
- [ ] Création des premiers utilisateurs
- [ ] Configuration des permissions
- [ ] Test de toutes les fonctionnalités
- [ ] Sauvegarde initiale créée
- [ ] (Optionnel) Service configuré pour démarrage automatique

---

**Félicitations ! Votre système de gestion de stock IT est maintenant opérationnel ! 🎉**
