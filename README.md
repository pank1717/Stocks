# 📦 Gestion de Stock IT - Application Web

Application complète de gestion d'inventaire IT avec suivi des mouvements, maintenances, et analytics avancés.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Fonctionnalités principales

### 📊 Gestion d'inventaire
- ➕ Ajout, modification, suppression d'articles
- 📦 Suivi des quantités en temps réel
- 🏷️ Catégorisation avancée (10 catégories IT)
- 📍 Gestion des emplacements physiques
- 💰 Suivi des prix et valeurs
- 🏢 Gestion des fournisseurs

### 📥 Import/Export
- 📥 **Import CSV en masse** avec validation
- 📊 **Export CSV** complet
- 📄 **Rapport imprimable** (PDF-ready)
- 💾 **Backup/Restore** complet (JSON)
- 📋 **Duplication d'articles** rapide

### 🔍 Recherche & Filtrage
- 🔍 Recherche simple et rapide
- 🔍+ **Recherche avancée** multi-critères
  - Filtres par catégorie, stock, prix, dates
  - Plages de quantité et prix
  - Filtrage par emplacement, fournisseur, notes

### 📊 Analytics & Statistiques
- **Tableau de bord KPIs** en temps réel
- 📈 **5 graphiques interactifs** (Chart.js)
  - Répartition par catégorie
  - État du stock
  - Valeur par catégorie
  - Top emplacements
  - Activité mensuelle
- 📉 Alertes stock faible automatiques
- 💹 Statistiques par catégorie

### 🔧 Maintenance & Réparations
- 🛠️ **Suivi des maintenances** (préventive, réparation, upgrade)
- 📅 Planification avec dates de début/fin
- 💰 Suivi des coûts de maintenance
- 👤 Assignation aux techniciens
- ✅ Statuts (en cours / terminée)
- 📋 Historique complet

### 👤 Gestion des prêts
- 📤 Prêts d'équipement avec suivi
- 📅 Dates de retour prévues
- 👥 Suivi des personnes emprunteuses
- 🔔 Notifications de retard

### 🔒 Sécurité & Permissions
- 👑 **3 rôles utilisateurs** (Admin, Manager, Viewer)
- 🔐 Authentification sécurisée (SHA256)
- ⏱️ Timeout de session (2h)
- 🛡️ Limitations tentatives de connexion
- 💪 Validation force mot de passe
- 📋 **Audit trail complet** (1000 dernières actions)

### 📜 Historique & Traçabilité
- 📖 **Historique complet par article**
  - Modifications (qui, quand, quoi)
  - Mouvements de stock
  - Maintenances effectuées
- 📈 Graphiques d'évolution du stock
- 👤 Traçabilité complète des actions

### 🎨 Interface & UX
- 🌓 Mode sombre/clair
- 📱 Design responsive
- 🎴 Vue grille/liste
- 🏷️ Génération QR codes
- 🖨️ Impression d'étiquettes en masse
- 🔔 Centre de notifications
- ⌨️ Raccourcis clavier

---

## 🚀 Installation rapide

### Prérequis
- Node.js 14+ et npm

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/pank1717/Stocks.git
cd Stocks

# Installer les dépendances
npm install

# Lancer l'application
node server.js
```

Ouvrez votre navigateur sur : **http://localhost:3000**

### Première connexion
- **Utilisateur :** `admin`
- **Mot de passe :** `admin`

⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

---

## 📖 Documentation complète

Pour une installation détaillée, configuration avancée et dépannage, consultez :

**👉 [INSTALLATION.md](./INSTALLATION.md)** - Guide d'installation complet

Ce guide couvre :
- Installation sur Windows, Linux, macOS
- Configuration en tant que service
- Accès réseau multi-utilisateurs
- Sauvegardes et restaurations
- Dépannage et support
- Configuration avancée

---

## 🏗️ Architecture technique

### Stack technologique
- **Backend :** Node.js + Express.js
- **Base de données :** SQLite3
- **Frontend :** Vanilla JavaScript (ES6+)
- **Graphiques :** Chart.js
- **QR Codes :** qrcode.js
- **Sécurité :** CryptoJS (SHA256)

### Structure des fichiers
```
Stocks/
├── server.js              # Serveur Express
├── index.html             # Interface web
├── script.js              # Logique applicative (4000+ lignes)
├── styles.css             # Styles CSS
├── package.json           # Dépendances
├── inventory.db           # Base SQLite (auto-générée)
├── INSTALLATION.md        # Guide d'installation
└── README.md              # Ce fichier
```

---

## 🔄 Mises à jour récentes

### Version 2.0.0 (Novembre 2024)

**Nouvelles fonctionnalités majeures :**
- ✨ Tableau de bord statistiques avancé avec 5 graphiques
- 🔍 Recherche avancée multi-critères
- 🔧 Module de gestion des maintenances
- 📄 Export rapport imprimable (PDF-ready)
- 📥 Import CSV en masse avec validation
- 📋 Duplication d'articles
- 📜 Historique complet intégrant l'audit trail

**Améliorations :**
- 🎨 Interface modernisée avec cartes en dégradé
- 🚀 Performance optimisée
- 🔒 Sécurité renforcée (3 couches)
- 📊 Analytics temps réel

---

## 🎯 Cas d'usage

Cette application est idéale pour :

- 🏢 **Départements IT** - Gestion du matériel informatique
- 🏭 **PME** - Suivi des équipements et outils
- 🏫 **Établissements scolaires** - Inventaire du matériel
- 🔬 **Laboratoires** - Gestion des équipements scientifiques
- 🏥 **Secteur médical** - Suivi des appareils médicaux

---

## 🔐 Sécurité

### Bonnes pratiques implémentées
- ✅ Hachage des mots de passe (SHA256)
- ✅ Validation des entrées
- ✅ Protection CSRF
- ✅ Timeout de session
- ✅ Limitation des tentatives de connexion
- ✅ Audit trail complet
- ✅ Permissions granulaires

### Recommandations
- 🔒 Ne pas exposer sur Internet sans VPN/proxy
- 💾 Sauvegardes régulières
- 🔑 Mots de passe forts
- 📊 Surveillance des logs d'audit

---

## 🐛 Signaler un bug

Créez une issue sur GitHub avec :
- Description du problème
- Étapes pour reproduire
- Captures d'écran si pertinent
- Version de Node.js
- Système d'exploitation

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 License

Ce projet est sous licence MIT.

---

## 👨‍💻 Auteur

**Développé avec ❤️ pour simplifier la gestion d'inventaire IT**

---

## 🙏 Remerciements

- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express](https://expressjs.com/) - Framework web
- [SQLite](https://www.sqlite.org/) - Base de données
- [Chart.js](https://www.chartjs.org/) - Bibliothèque de graphiques
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) - Génération QR codes

---

## 📞 Support

- 💬 GitHub Issues : [Créer une issue](https://github.com/pank1717/Stocks/issues)
- 📚 Documentation : [INSTALLATION.md](./INSTALLATION.md)

---

**⭐ Si ce projet vous est utile, n'oubliez pas de lui donner une étoile sur GitHub !**

---

*Dernière mise à jour : Novembre 2024*
