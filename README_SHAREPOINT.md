# Version SharePoint - Application de Gestion de Stock IT

## ✅ Solution 100% Microsoft - Sans serveur externe

Cette version permet d'héberger l'application **complètement dans SharePoint** sans aucun coût supplémentaire de serveur.

## 📋 Ce qui est inclus

- **Frontend** : HTML/CSS/JS hébergés dans SharePoint
- **Backend** : SharePoint Lists (remplace SQLite)
- **API** : SharePoint REST API (remplace Express/Node.js)
- **Authentification** : Microsoft 365 intégrée

## 📁 Fichiers pour SharePoint

| Fichier | Description |
|---------|-------------|
| `index-sharepoint.html` | Page HTML adaptée pour SharePoint |
| `styles.css` | Styles CSS (identique à la version serveur) |
| `script-sharepoint.js` | JavaScript utilisant SharePoint REST API |
| `config-sharepoint.js` | Configuration des URLs SharePoint |
| `SHAREPOINT_GUIDE.md` | Architecture et schéma des listes |
| `DEPLOYMENT_SHAREPOINT.md` | Guide de déploiement pas-à-pas |

## 🚀 Installation rapide

### 1. Créer les listes SharePoint (5 min)

Créez 2 listes dans votre site SharePoint :
- **Inventaire** (pour les articles)
- **HistoriqueStock** (pour l'historique des mouvements)

Voir détails dans `SHAREPOINT_GUIDE.md`

### 2. Télécharger les fichiers (2 min)

Créez une bibliothèque `AppInventaire` et téléchargez :
- `index-sharepoint.html` (renommer en `index.html`)
- `styles.css`
- `config-sharepoint.js`
- `script-sharepoint.js`

### 3. Configurer l'URL (1 min)

Éditez `config-sharepoint.js` et remplacez :
```javascript
siteUrl: 'https://votretenant.sharepoint.com/sites/VotreSite'
```

### 4. Créer une page SharePoint (2 min)

Créez une page et ajoutez un iframe vers votre `index.html`

### 5. C'est prêt! 🎉

Votre application fonctionne maintenant 100% dans SharePoint!

## 📊 Architecture

```
SharePoint Site
├── Lists
│   ├── Inventaire (Articles)
│   └── HistoriqueStock (Mouvements)
└── AppInventaire (Bibliothèque)
    ├── index.html
    ├── styles.css
    ├── config-sharepoint.js
    └── script-sharepoint.js
```

## ✨ Avantages

✅ **Gratuit** - Pas de serveur externe à payer
✅ **Intégré** - Permissions Microsoft 365
✅ **Sécurisé** - Authentification automatique
✅ **Sauvegardé** - Backups SharePoint inclus
✅ **Mobile** - Accessible via app SharePoint
✅ **Collaboratif** - Multi-utilisateurs

## ⚠️ Limitations

- **Limite** : ~1000 articles recommandés (5000 max)
- **Performance** : Plus lent que SQLite
- **Connexion** : Nécessite Internet
- **Portabilité** : Lié à SharePoint

## 📖 Documentation

- **Guide complet** : `SHAREPOINT_GUIDE.md`
- **Déploiement** : `DEPLOYMENT_SHAREPOINT.md`
- **Version serveur** : `README.md`

## 🔄 Comparaison des versions

| Critère | Version SharePoint | Version Serveur |
|---------|-------------------|----------------|
| **Coût** | Gratuit* | 5-10 CHF/mois |
| **Hébergement** | SharePoint | Serveur Node.js |
| **Base de données** | SharePoint Lists | SQLite |
| **Performance** | Moyenne | Rapide |
| **Portabilité** | Non | Oui |
| **Limite articles** | ~1000 | Illimité |
| **Authentification** | Microsoft 365 | À configurer |

*Nécessite licence Microsoft 365

## 🛠️ Support

### Version SharePoint
Voir `DEPLOYMENT_SHAREPOINT.md` pour le dépannage

### Version Serveur
Voir `README.md` pour Node.js + SQLite

## 🤔 Quelle version choisir ?

### Choisissez **SharePoint** si :
- ✅ Vous avez Microsoft 365
- ✅ Vous voulez éviter un serveur externe
- ✅ Vous avez moins de 1000 articles
- ✅ Vous voulez l'authentification Microsoft

### Choisissez **Serveur** (Node.js) si :
- ✅ Vous voulez une solution portable
- ✅ Vous voulez les meilleures performances
- ✅ Vous avez plus de 1000 articles
- ✅ Vous voulez le contrôle total

## 📞 Contact

Questions ? Consultez les guides de déploiement ou ouvrez une issue sur GitHub.

---

**Made with ❤️ by Claude Code**
