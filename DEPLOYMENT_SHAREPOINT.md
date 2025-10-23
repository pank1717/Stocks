# Déploiement sur SharePoint - Guide Étape par Étape

## Prérequis

- Accès à un site SharePoint moderne (Microsoft 365)
- Permissions pour créer des listes SharePoint
- Permissions pour créer des pages et télécharger des fichiers

## Étape 1 : Créer les listes SharePoint

### 1.1 Créer la liste "Inventaire"

1. Dans votre site SharePoint, allez dans **⚙️ Paramètres** → **Contenu du site**
2. Cliquez sur **+ Nouveau** → **Liste**
3. Sélectionnez **Liste vierge**
4. Nom : `Inventaire`
5. Cliquez sur **Créer**

6. Ajoutez les colonnes suivantes :
   - Renommez "Titre" en "Nom" (ou laissez "Title")
   - Ajoutez les colonnes ci-dessous

| Nom de colonne | Type | Configuration |
|----------------|------|---------------|
| ItemID | Texte | Obligatoire |
| Modele | Texte | Optionnel |
| Quantite | Nombre | Obligatoire, décimal = 0 |
| Categorie | Choix | Valeurs : Informatique, Peripheriques, Ecrans, Connectique, Alimentation, Docking, Audio, Reseau, Stockage, Mobile |
| NumeroSerie | Texte | Optionnel |
| Emplacement | Texte | Optionnel |
| Fournisseur | Texte | Optionnel |
| DateAchat | Date | Optionnel |
| PrixUnitaire | Devise | Optionnel, Format : CHF |
| Photo | Texte | Optionnel, 1 ligne |
| Notes | Texte multiligne | Optionnel |

### 1.2 Créer la liste "HistoriqueStock"

1. Répétez les étapes 1-4 ci-dessus
2. Nom : `HistoriqueStock`
3. Ajoutez les colonnes suivantes :

| Nom de colonne | Type | Configuration |
|----------------|------|---------------|
| ItemID | Texte | Obligatoire |
| TypeMouvement | Choix | Valeurs : Ajout, Retrait |
| Quantite | Nombre | Obligatoire, décimal = 0 |
| QuantiteAvant | Nombre | Obligatoire, décimal = 0 |
| QuantiteApres | Nombre | Obligatoire, décimal = 0 |
| NotesMouvement | Texte multiligne | Optionnel |
| DateMouvement | Date et heure | Obligatoire |

## Étape 2 : Créer la bibliothèque de documents

1. Dans **Contenu du site**, cliquez sur **+ Nouveau** → **Bibliothèque de documents**
2. Nom : `AppInventaire`
3. Cliquez sur **Créer**

## Étape 3 : Télécharger les fichiers de l'application

1. Ouvrez la bibliothèque `AppInventaire`
2. Cliquez sur **Télécharger** → **Fichiers**
3. Sélectionnez et téléchargez ces fichiers :
   - `index-sharepoint.html` (renommez-le en `index.html` après upload)
   - `styles.css`
   - `config-sharepoint.js`
   - `script-sharepoint.js`

## Étape 4 : Configurer les URLs SharePoint

1. Ouvrez le fichier `config-sharepoint.js` dans la bibliothèque
2. Cliquez sur **Modifier** (l'icône crayon ou ouvrir dans l'éditeur)
3. Modifiez les valeurs :

```javascript
const SHAREPOINT_CONFIG = {
    siteUrl: 'https://votretenant.sharepoint.com/sites/VotreSite',
    listNameInventaire: 'Inventaire',
    listNameHistorique: 'HistoriqueStock',
    debug: false  // mettez true pour le debug
};
```

4. **Important** : Remplacez `votretenant.sharepoint.com/sites/VotreSite` par l'URL réelle de votre site SharePoint

### Comment trouver l'URL de votre site :
- Regardez dans la barre d'adresse de votre navigateur
- Copiez tout jusqu'au nom du site (ex: `.../sites/IT` ou `.../sites/MonSite`)
- **Ne mettez PAS** de `/` à la fin

5. Enregistrez le fichier

## Étape 5 : Créer la page SharePoint

### Option A : Page avec WebPart Script Editor (Recommandé)

1. Dans votre site SharePoint, cliquez sur **+ Nouveau** → **Page**
2. Choisissez un modèle (ex: **Page vierge**)
3. Nom de la page : `Gestion Stock IT`
4. Ajoutez un WebPart **Script Editor** ou **Éditeur de code**
5. Insérez ce code :

```html
<style>
    .inventory-app-container {
        width: 100%;
        height: 100vh;
        border: none;
    }
</style>

<iframe
    class="inventory-app-container"
    src="/sites/VotreSite/AppInventaire/index.html"
    frameborder="0"
    allowfullscreen>
</iframe>
```

6. **Remplacez** `/sites/VotreSite` par le chemin de votre site
7. Publiez la page

### Option B : Page avec WebPart Incorporer (Plus simple)

1. Dans votre site SharePoint, cliquez sur **+ Nouveau** → **Page**
2. Choisissez **Page vierge**
3. Nom : `Gestion Stock IT`
4. Ajoutez un WebPart **Incorporer**
5. Dans le code, collez l'URL complète vers votre `index.html` :
   ```
   https://votretenant.sharepoint.com/sites/VotreSite/AppInventaire/index.html
   ```
6. Publiez la page

## Étape 6 : Tester l'application

1. Ouvrez la page que vous venez de créer
2. Vous devriez voir l'application se charger
3. Si vous voyez des erreurs :
   - Ouvrez la Console du navigateur (F12)
   - Vérifiez que les URLs dans `config-sharepoint.js` sont correctes
   - Vérifiez les noms des listes SharePoint

## Étape 7 : Importer les données d'exemple (Optionnel)

### Méthode manuelle :

1. Ouvrez la liste "Inventaire"
2. Cliquez sur **+ Nouveau**
3. Remplissez les champs avec les données de votre choix

### Méthode rapide avec Excel :

1. Créez un fichier Excel avec ces colonnes :
   ```
   Title | ItemID | Modele | Quantite | Categorie | ...
   ```

2. Dans SharePoint, allez dans la liste "Inventaire"
3. Cliquez sur **Intégrer** → **Importer depuis Excel**
4. Suivez l'assistant

## Étape 8 : Configuration des permissions

1. Allez dans **Paramètres de la liste "Inventaire"**
2. Cliquez sur **Permissions pour cette liste**
3. Configurez qui peut :
   - **Voir** les articles
   - **Modifier** les articles
   - **Ajouter/Supprimer** des articles

## Dépannage

### Erreur : "Access denied" ou 403

**Solution** : Vérifiez les permissions des listes SharePoint

### Erreur : "List does not exist"

**Solution** : Vérifiez les noms des listes dans `config-sharepoint.js`

### L'application ne se charge pas

**Solutions** :
1. Vérifiez que tous les fichiers sont dans la bibliothèque `AppInventaire`
2. Vérifiez l'URL dans la page SharePoint
3. Ouvrez la console du navigateur (F12) pour voir les erreurs

### Erreur CORS

**Solution** : Les fichiers doivent être hébergés sur le même site SharePoint que les listes

### Les données ne s'affichent pas

**Solutions** :
1. Ouvrez la console du navigateur (F12)
2. Activez le debug dans `config-sharepoint.js` : `debug: true`
3. Vérifiez que les listes contiennent des données

## Performance

- **Limite recommandée** : 1000 articles dans l'inventaire
- **Limite technique SharePoint** : 5000 articles (avec indexation)
- **Temps de chargement** : 2-5 secondes selon la taille de la base

## Sauvegardes

Les données sont automatiquement sauvegardées par SharePoint :
- Sauvegarde quotidienne
- Historique de versions des éléments
- Corbeille (30 jours)

## Améliorations futures

1. **Permissions avancées** : Permissions par catégorie
2. **Notifications** : Email lors de stock bas
3. **Power Automate** : Automatisations (ex: commande automatique)
4. **Power BI** : Tableaux de bord et rapports
5. **Export Excel** : Bouton d'export intégré

## Support

En cas de problème :
1. Vérifiez la console du navigateur (F12)
2. Activez le mode debug
3. Vérifiez les URLs et noms de listes
4. Consultez la documentation SharePoint REST API

---

**Félicitations!** Votre application est maintenant intégrée à SharePoint 100% gratuitement, sans serveur externe! 🎉
