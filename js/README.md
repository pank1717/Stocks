# 📦 Architecture Modulaire - Gestion de Stock IT

Ce dossier contient le code JavaScript refactorisé en modules ES6, remplaçant le fichier monolithique `script.js` (4400 lignes).

## 🎯 Objectif

Transformer une application monolithique en une architecture modulaire, maintenable et évolutive.

**Avant** : 1 fichier de 4400 lignes avec 141 fonctions  
**Après** : 20+ modules de 50-200 lignes chacun

---

## 📁 Structure des dossiers

```
js/
├── config/              → Configuration et constantes
│   ├── constants.js         Icons, labels, permissions
│   └── api-config.js        URLs API
│
├── services/            → Services métier (logique)
│   ├── storage-service.js   Gestion localStorage
│   ├── api-service.js       Appels API
│   ├── auth-service.js      Authentification
│   └── audit-service.js     Logs d'audit
│
├── components/          → Composants UI réutilisables
│   ├── modal.js             Gestion des modales
│   ├── notification.js      Notifications & toasts
│   ├── form.js              Handlers de formulaires
│   └── ui.js                Mise à jour UI (thème, vue)
│
├── modules/             → Modules fonctionnels
│   ├── items.js             Gestion des articles
│   ├── users.js             Gestion des utilisateurs
│   ├── suppliers.js         Gestion des fournisseurs
│   ├── loans.js             Prêts d'équipement
│   ├── maintenance.js       Maintenances
│   ├── statistics.js        Statistiques & graphiques
│   └── search.js            Recherche avancée
│
├── utils/               → Utilitaires purs
│   ├── formatters.js        Formatage dates, prix, etc.
│   ├── validators.js        Validation de formulaires
│   ├── qrcode.js            Génération QR codes
│   └── export.js            Export CSV, PDF
│
└── main.js              → Point d'entrée (initialisation)
```

---

## ✅ Avantages de cette architecture

### 1. **Maintenabilité**
- Code organisé par fonctionnalité
- Facile de trouver et modifier du code
- Moins de conflits en équipe

### 2. **Réutilisabilité**
- Modules indépendants réutilisables
- Tests unitaires plus faciles
- Partage de code entre projets

### 3. **Performances**
- Chargement à la demande possible (lazy loading)
- Bundle splitting pour optimiser
- Meilleure mise en cache

### 4. **Qualité**
- Séparation des responsabilités (SoC)
- Dépendances claires via imports
- Moins de variables globales

---

## 🚀 Utilisation

### Import simple

```javascript
// Importer une constante
import { categoryIcons, PERMISSIONS } from './config/constants.js';

// Importer un service
import storageService from './services/storage-service.js';

// Importer une fonction utilitaire
import { formatDate, formatPrice } from './utils/formatters.js';
```

### Dans le HTML

```html
<!-- Type module required pour ES6 imports -->
<script type="module" src="js/main.js"></script>
```

---

## 📝 Exemple : Avant/Après

### ❌ Avant (monolithique)

```javascript
// script.js (ligne 2267)
function formatDate(dateString) {
    // ... 10 lignes
}

function formatPrice(price) {
    // ... 5 lignes
}

// 4390 autres lignes...
```

### ✅ Après (modulaire)

```javascript
// js/utils/formatters.js
export function formatDate(dateString) {
    // ... 10 lignes
}

export function formatPrice(price) {
    // ... 5 lignes
}
```

```javascript
// js/modules/items.js
import { formatDate, formatPrice } from '../utils/formatters.js';

export function renderItem(item) {
    const formattedDate = formatDate(item.created_at);
    const formattedPrice = formatPrice(item.price);
    // ...
}
```

---

## 🔧 Modules créés

### ✅ config/ (Déjà créés)

| Fichier | Description | Exports |
|---------|-------------|---------|
| `constants.js` | Constantes app | categoryIcons, categoryLabels, PERMISSIONS, roleLabels, etc. |
| `api-config.js` | Configuration API | API_URL, API_ENDPOINTS |

### ✅ services/ (Déjà créés)

| Fichier | Description | Exports |
|---------|-------------|---------|
| `storage-service.js` | Wrapper localStorage | get(), set(), remove(), clear() |

### ✅ utils/ (Déjà créés)

| Fichier | Description | Exports |
|---------|-------------|---------|
| `validators.js` | Validation formulaires | isValidEmail(), validatePasswordStrength(), etc. |

### 🔜 À créer (TODO)

- `services/api-service.js` - Tous les appels API (fetch)
- `services/auth-service.js` - Authentification et sessions
- `services/audit-service.js` - Logs d'audit
- `components/modal.js` - Gestion modales
- `components/notification.js` - Notifications/toasts
- `modules/items.js` - CRUD articles
- `modules/statistics.js` - Stats et graphiques
- `utils/formatters.js` - Formatage données
- `utils/export.js` - Export CSV/PDF
- `main.js` - Initialisation app

---

## 📚 Documentation par module

### config/constants.js

Contient toutes les constantes de l'application.

```javascript
import { categoryIcons, PERMISSIONS } from './config/constants.js';

// Utiliser les icônes de catégories
const icon = categoryIcons['informatique']; // → 🖥️

// Vérifier les permissions
const canEdit = PERMISSIONS.admin.canEditItems; // → true
```

### services/storage-service.js

Service centralisé pour localStorage (avec gestion d'erreurs).

```javascript
import storageService from './services/storage-service.js';

// Sauvegarder
storageService.set('myKey', { name: 'Value' });

// Récupérer
const data = storageService.get('myKey', defaultValue);

// Supprimer
storageService.remove('myKey');
```

### utils/validators.js

Fonctions de validation pour les formulaires.

```javascript
import { isValidEmail, validatePasswordStrength } from './utils/validators.js';

const valid = isValidEmail('test@example.com'); // → true

const strength = validatePasswordStrength('MyPass123!');
// → { score: 4, strength: 'medium', feedback: [...] }
```

---

## 🧪 Tests

Avec cette architecture modulaire, chaque module peut être testé indépendamment :

```javascript
// tests/utils/formatters.test.js
import { formatPrice } from '../../js/utils/formatters.js';

test('formatPrice should format CHF correctly', () => {
    expect(formatPrice(1299)).toBe('CHF 1\'299.00');
});
```

---

## 🔄 Migration progressive

Vous n'avez pas besoin de tout migrer d'un coup :

1. **Créer les modules** (comme déjà fait)
2. **Garder l'ancien script.js** fonctionnel
3. **Migrer fonctionnalité par fonctionnalité**
4. **Tester au fur et à mesure**
5. **Supprimer l'ancien code** une fois validé

---

## 📖 Bonnes pratiques

### 1. Un module = Une responsabilité

❌ Mauvais : Tout mélanger  
✅ Bon : Un fichier pour les formatters, un autre pour les validators

### 2. Exports explicites

```javascript
// Bon
export function formatDate(date) { }
export const API_URL = '...';

// À éviter
export default { formatDate, formatPrice }; // moins clair
```

### 3. Nommage cohérent

- **Fichiers** : kebab-case (`auth-service.js`)
- **Fonctions** : camelCase (`formatDate`)
- **Constantes** : UPPER_CASE (`API_URL`)
- **Classes** : PascalCase (`StorageService`)

### 4. Documentation

Toujours documenter les exports publics :

```javascript
/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (DD/MM/YYYY)
 */
export function formatDate(dateString) {
    // ...
}
```

---

## 🚧 Prochaines étapes

1. ✅ Créer structure de dossiers
2. ✅ Créer config/ et utils/
3. 🔄 Créer services/ complets
4. ⏳ Créer components/
5. ⏳ Créer modules/
6. ⏳ Créer main.js
7. ⏳ Tester avec index-refactored.html
8. ⏳ Ajouter ESLint + Prettier
9. ⏳ Écrire tests unitaires

---

## 💡 Ressources

- [MDN: JavaScript Modules](https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Modules)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [ES6 Features](https://github.com/lukehoban/es6features)

---

**📅 Dernière mise à jour** : Novembre 2024  
**👤 Auteur** : Refactoring Phase 2 - Stock Management App
