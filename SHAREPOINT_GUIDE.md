# Guide d'intégration SharePoint - Application Gestion de Stock IT

## Architecture 100% SharePoint (Sans serveur externe)

Cette solution vous permet d'héberger l'application complètement dans SharePoint sans coût supplémentaire.

## Vue d'ensemble

**Frontend** : Fichiers HTML/CSS/JS hébergés dans bibliothèque SharePoint
**Backend** : SharePoint Lists (remplace SQLite)
**API** : SharePoint REST API (remplace Express/Node.js)
**Authentification** : Intégrée SharePoint/Microsoft 365

## Étape 1 : Créer les listes SharePoint

### Liste 1 : Inventaire

Créez une liste SharePoint nommée **"Inventaire"** avec les colonnes suivantes :

| Nom de colonne | Type | Obligatoire | Notes |
|----------------|------|-------------|-------|
| Title | Texte ligne unique | Oui | Nom de l'article (colonne par défaut) |
| ItemID | Texte ligne unique | Oui | ID unique (ex: 1730051000001) |
| Modele | Texte ligne unique | Non | Modèle/Spécifications |
| Quantite | Nombre | Oui | Stock actuel |
| Categorie | Choix | Oui | Voir valeurs ci-dessous |
| NumeroSerie | Texte ligne unique | Non | N° de série |
| Emplacement | Texte ligne unique | Non | Emplacement physique |
| Fournisseur | Texte ligne unique | Non | Nom du fournisseur |
| DateAchat | Date | Non | Date d'achat |
| PrixUnitaire | Devise | Non | Prix en CHF |
| Photo | Texte ligne unique | Non | Emoji (ex: 💻) |
| Notes | Texte multiligne | Non | Commentaires |

**Valeurs pour la colonne "Categorie" (Choix) :**
- Informatique
- Peripheriques
- Ecrans
- Connectique
- Alimentation
- Docking
- Audio
- Reseau
- Stockage
- Mobile

### Liste 2 : HistoriqueStock

Créez une liste SharePoint nommée **"HistoriqueStock"** avec les colonnes suivantes :

| Nom de colonne | Type | Obligatoire | Notes |
|----------------|------|-------------|-------|
| Title | Texte ligne unique | Oui | Description du mouvement (colonne par défaut) |
| ItemID | Texte ligne unique | Oui | Référence à l'article |
| TypeMouvement | Choix | Oui | "Ajout" ou "Retrait" |
| Quantite | Nombre | Oui | Quantité ajoutée/retirée |
| QuantiteAvant | Nombre | Oui | Stock avant |
| QuantiteApres | Nombre | Oui | Stock après |
| NotesMouvement | Texte multiligne | Non | Raison du mouvement |
| DateMouvement | Date et heure | Oui | Date du mouvement |

**Valeurs pour "TypeMouvement" (Choix) :**
- Ajout
- Retrait

## Étape 2 : Configuration des permissions

1. **Permissions de la liste Inventaire** :
   - Contributeur : Peut ajouter/modifier/supprimer des articles
   - Lecteur : Peut uniquement consulter

2. **Permissions de la liste HistoriqueStock** :
   - Contributeur : Peut ajouter l'historique (via l'app)
   - Lecteur : Peut consulter l'historique

## Étape 3 : Structure des dossiers SharePoint

Créez une bibliothèque de documents **"AppInventaire"** avec cette structure :

```
AppInventaire/
├── index.html          (Page principale)
├── styles.css          (Styles CSS)
├── script-sharepoint.js (JavaScript adapté pour SharePoint)
└── config.js           (Configuration)
```

## Étape 4 : URLs SharePoint nécessaires

Vous aurez besoin des URLs suivantes :

```
Site SharePoint : https://votretenant.sharepoint.com/sites/VotreSite
Liste Inventaire : https://votretenant.sharepoint.com/sites/VotreSite/Lists/Inventaire
Liste Historique : https://votretenant.sharepoint.com/sites/VotreSite/Lists/HistoriqueStock
```

## Étape 5 : Importer les données d'exemple

### Option A : Manuellement via interface SharePoint
Ajoutez les articles un par un dans la liste "Inventaire"

### Option B : Import Excel
1. Exportez les données du fichier `inventory.db` vers Excel
2. Utilisez "Import from Excel" dans SharePoint

### Option C : PowerShell (Rapide)
Script PowerShell pour importer automatiquement (fourni séparément)

## Étape 6 : Créer la page d'application

1. Dans votre site SharePoint, créez une nouvelle **Page moderne**
2. Nommez-la "Gestion de Stock IT"
3. Ajoutez un WebPart **"Incorporer"** (Embed)
4. Collez l'URL vers votre `index.html` dans la bibliothèque

**Ou utilisez un WebPart Script Editor** (si disponible dans votre environnement)

## Avantages de cette solution

✅ **Gratuit** : Aucun serveur externe
✅ **Intégré** : Utilise les permissions SharePoint
✅ **Sécurisé** : Authentification Microsoft intégrée
✅ **Sauvegardé** : Backups SharePoint automatiques
✅ **Mobile** : Accessible via SharePoint mobile app
✅ **Collaboratif** : Plusieurs utilisateurs simultanés
✅ **Audit** : Historique SharePoint des modifications

## Limitations à connaître

⚠️ **Quotas SharePoint** : Limite de 30 000 éléments par vue de liste
⚠️ **Performance** : Plus lent que SQLite pour grandes quantités
⚠️ **API REST** : Nécessite configuration CORS dans certains cas
⚠️ **Offline** : Nécessite connexion Internet

## Architecture technique

```
┌─────────────────────────────────────────┐
│     Page SharePoint Moderne              │
│  ┌────────────────────────────────────┐ │
│  │  WebPart Embed ou Script Editor    │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  index.html + CSS + JS       │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
              SharePoint REST API
                    ↓
    ┌──────────────┴──────────────┐
    ↓                              ↓
┌─────────────────┐    ┌──────────────────┐
│ Liste Inventaire│    │ Liste Historique │
│  (18 articles)  │    │  (mouvements)    │
└─────────────────┘    └──────────────────┘
```

## Prochaines étapes

1. Créer les listes SharePoint
2. Télécharger les fichiers adaptés pour SharePoint
3. Configurer les URLs dans config.js
4. Tester l'application
5. Importer les données d'exemple

## Support et dépannage

### Erreur CORS
Si vous obtenez des erreurs CORS, vous devez :
- Héberger les fichiers dans la même collection de sites SharePoint
- Ou configurer les headers CORS dans SharePoint Admin

### Erreur 403 (Accès refusé)
Vérifiez les permissions des listes SharePoint

### Données qui ne s'affichent pas
Vérifiez les noms exacts des colonnes et listes SharePoint

## Migration depuis SQLite

Si vous avez déjà des données dans `inventory.db`, je fournis un script de migration pour exporter vers Excel, puis importer dans SharePoint.

---

**Prêt à commencer ?**
Les fichiers adaptés pour SharePoint seront créés dans les prochains commits.
