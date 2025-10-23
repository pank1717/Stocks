# Application de Gestion de Stock IT

Une application web complète pour gérer l'inventaire de vos actifs informatiques (ordinateurs, périphériques, câbles, docking stations, etc.) avec base de données SQLite.

## Fonctionnalités principales

### Gestion des articles
- Ajout d'articles avec informations détaillées :
  - Nom de l'article (obligatoire)
  - Modèle / Spécifications (ex: "Latitude 5520 - 32GB RAM")
  - Quantité initiale
  - Catégorie avec icône colorée
  - Photo (emoji 64x64px)
  - N° de série
  - Emplacement physique
  - Fournisseur
  - Date d'achat
  - Prix unitaire (CHF)
  - Notes / Commentaires

### Gestion du stock
- Ajuster le stock facilement (ajouter/retirer des unités)
- Historique complet de tous les mouvements avec dates
- Notes pour chaque mouvement
- Modification et suppression d'articles

### Recherche et organisation
- Recherche intelligente par nom, modèle, catégorie, n° série ou emplacement
- Filtrage par catégorie
- 10 catégories prédéfinies avec icônes

### Statistiques
- Nombre d'articles différents
- Nombre d'unités totales
- Articles en stock / épuisés
- Valeur totale du stock en CHF

### Interface
- Design moderne et professionnel
- Cartes visuelles avec emojis
- Responsive (mobile, tablette, ordinateur)
- Navigation intuitive

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : Node.js + Express
- **Base de données** : SQLite3 (fichier unique, ultra-portable)
- **Architecture** : REST API

## Installation

### Prérequis

- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

### Étapes d'installation

1. **Cloner ou télécharger le projet**

```bash
git clone <votre-repo>
cd Stocks
```

2. **Installer les dépendances**

```bash
npm install
```

Cette commande installera :
- express (serveur web)
- sqlite3 (base de données)
- cors (gestion des CORS)
- nodemon (dev uniquement, pour le rechargement automatique)

3. **Démarrer l'application**

Mode production :
```bash
npm start
```

Mode développement (avec rechargement automatique) :
```bash
npm run dev
```

4. **Accéder à l'application**

Ouvrez votre navigateur et allez sur :
```
http://localhost:3000
```

## Structure du projet

```
Stocks/
├── index.html          # Page principale de l'application
├── styles.css          # Styles CSS
├── script.js           # JavaScript frontend (API calls)
├── server.js           # Serveur Express + API REST
├── package.json        # Dépendances Node.js
├── inventory.db        # Base de données SQLite (créée automatiquement)
├── .gitignore          # Fichiers à ignorer par Git
└── README.md           # Ce fichier
```

## API REST

L'application expose une API REST complète :

### Articles

- `GET /api/items` - Récupérer tous les articles
- `GET /api/items/:id` - Récupérer un article avec son historique
- `POST /api/items` - Créer un nouvel article
- `PUT /api/items/:id` - Modifier un article
- `DELETE /api/items/:id` - Supprimer un article

### Stock

- `POST /api/items/:id/adjust` - Ajuster le stock d'un article
- `GET /api/items/:id/history` - Récupérer l'historique d'un article

### Statistiques

- `GET /api/statistics` - Récupérer les statistiques globales

## Déploiement

### Sur un serveur Linux/Unix

1. Transférer tous les fichiers sur le serveur
2. Installer Node.js sur le serveur
3. Installer les dépendances : `npm install --production`
4. Lancer avec PM2 (gestionnaire de processus) :

```bash
npm install -g pm2
pm2 start server.js --name "stock-app"
pm2 save
pm2 startup
```

### Sur un serveur Windows

1. Transférer tous les fichiers
2. Installer Node.js
3. Installer les dépendances : `npm install --production`
4. Créer un service Windows ou utiliser un gestionnaire de processus

### Configuration du port

Par défaut, l'application utilise le port 3000. Pour changer :

```bash
PORT=8080 npm start
```

Ou créer un fichier `.env` :
```
PORT=8080
```

## Sauvegarde et restauration

### Sauvegarde

La base de données est stockée dans un seul fichier : `inventory.db`

Pour sauvegarder vos données :
```bash
cp inventory.db inventory.backup.db
```

Ou programmez une sauvegarde automatique :
```bash
# Sauvegarde quotidienne (cron Linux)
0 2 * * * cp /chemin/vers/inventory.db /chemin/vers/backups/inventory-$(date +\%Y\%m\%d).db
```

### Restauration

Pour restaurer une sauvegarde :
```bash
cp inventory.backup.db inventory.db
```

### Migration vers un autre serveur

1. Arrêter l'application
2. Copier tout le dossier (y compris `inventory.db`)
3. Sur le nouveau serveur : `npm install --production`
4. Démarrer : `npm start`

## Base de données

### Schéma

**Table items** :
- id (TEXT, PRIMARY KEY)
- name (TEXT, NOT NULL)
- model (TEXT)
- quantity (INTEGER)
- category (TEXT, NOT NULL)
- serial (TEXT)
- location (TEXT)
- supplier (TEXT)
- purchase_date (TEXT)
- price (REAL)
- photo (TEXT)
- notes (TEXT)
- created_at (TEXT)
- updated_at (TEXT)

**Table stock_history** :
- id (INTEGER, PRIMARY KEY AUTOINCREMENT)
- item_id (TEXT, FOREIGN KEY)
- type (TEXT) - 'add' ou 'remove'
- quantity (INTEGER)
- previous_quantity (INTEGER)
- new_quantity (INTEGER)
- note (TEXT)
- date (TEXT)

### Accès direct à la base

Pour accéder directement à la base de données SQLite :

```bash
sqlite3 inventory.db
```

Commandes utiles :
```sql
-- Voir toutes les tables
.tables

-- Voir tous les articles
SELECT * FROM items;

-- Voir l'historique
SELECT * FROM stock_history;

-- Quitter
.quit
```

## Catégories disponibles

1. Informatique
2. Périphériques
3. Écrans
4. Connectique
5. Alimentation
6. Docking & Hubs
7. Audio
8. Réseau
9. Stockage
10. Mobile

## Personnalisation

### Modifier les catégories

Éditez le fichier `script.js` et modifiez les objets `categoryIcons` et `categoryLabels`.

### Modifier la devise

Par défaut, les prix sont en CHF. Pour changer :

Éditez `script.js`, fonction `formatPrice()` :
```javascript
return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',  // Changez ici
    minimumFractionDigits: 2
}).format(price);
```

## Support et contribution

Pour signaler un bug ou demander une fonctionnalité, créez une issue sur le dépôt Git.

## Licence

MIT

## Auteur

Application créée avec Claude Code
