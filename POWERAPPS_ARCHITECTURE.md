# Application de Gestion de Stock IT - Power Apps

## Vue d'ensemble

Cette documentation complète vous permettra de créer l'application de gestion de stock dans **Power Apps** avec **Dataverse** (ou SharePoint Lists).

## Architecture de l'application

### Type d'application
**Canvas App** (recommandé pour cette application)

### Base de données
**Option 1 : Dataverse** (Recommandé)
- Plus performant
- Relations entre tables
- Types de données avancés

**Option 2 : SharePoint Lists**
- Utilise vos listes SharePoint existantes
- Moins de fonctionnalités avancées
- Parfait si vous avez déjà SharePoint

## Structure de la base de données

### Table 1 : Articles (Inventaire)

| Colonne | Type Dataverse | Type SharePoint | Notes |
|---------|---------------|----------------|-------|
| Nom | Texte (100) | Ligne de texte | Nom de l'article |
| ItemID | Texte (50) | Ligne de texte | ID unique |
| Modele | Texte (200) | Ligne de texte | Modèle/Spécifications |
| Quantite | Nombre entier | Nombre | Stock actuel |
| Categorie | Choix | Choix | 10 valeurs prédéfinies |
| NumeroSerie | Texte (100) | Ligne de texte | N° de série |
| Emplacement | Texte (100) | Ligne de texte | Localisation |
| Fournisseur | Texte (100) | Ligne de texte | Nom fournisseur |
| DateAchat | Date | Date | Date d'achat |
| PrixUnitaire | Devise | Devise | Prix en CHF |
| Photo | Texte (10) | Ligne de texte | Emoji |
| Notes | Texte multiligne | Texte multiligne | Commentaires |

**Valeurs pour Categorie (Choix) :**
- Informatique
- Périphériques
- Écrans
- Connectique
- Alimentation
- Docking
- Audio
- Réseau
- Stockage
- Mobile

### Table 2 : HistoriqueStock

| Colonne | Type Dataverse | Type SharePoint | Notes |
|---------|---------------|----------------|-------|
| Article | Recherche (Articles) | Recherche | Lien vers l'article |
| ItemID | Texte (50) | Ligne de texte | ID de l'article |
| TypeMouvement | Choix | Choix | "Ajout" ou "Retrait" |
| Quantite | Nombre entier | Nombre | Quantité du mouvement |
| QuantiteAvant | Nombre entier | Nombre | Stock avant |
| QuantiteApres | Nombre entier | Nombre | Stock après |
| NoteMouvement | Texte multiligne | Texte multiligne | Raison |
| DateMouvement | Date et heure | Date et heure | Date du mouvement |

### Relations

**Dataverse** : Relation 1-N entre Articles et HistoriqueStock
**SharePoint** : Colonne Recherche vers la liste Articles

## Structure de l'application Power Apps

### Écrans (7 au total)

1. **EcranAccueil** - Dashboard avec statistiques
2. **EcranListeArticles** - Liste/Galerie de tous les articles
3. **EcranDetailsArticle** - Détails d'un article + actions
4. **EcranAjoutArticle** - Formulaire d'ajout
5. **EcranModificationArticle** - Formulaire de modification
6. **EcranAjustementStock** - Ajuster le stock
7. **EcranHistorique** - Historique des mouvements

### Navigation

```
EcranAccueil (Dashboard)
    ↓
EcranListeArticles (Galerie)
    ↓
EcranDetailsArticle
    ↓ (selon action)
    ├─→ EcranModificationArticle
    ├─→ EcranAjustementStock
    └─→ EcranHistorique
```

## Écrans détaillés

### 1. EcranAccueil (Dashboard)

**Composants :**
- Titre : "📦 Gestion de Stock IT"
- 5 cartes de statistiques
- Bouton "Voir tous les articles"
- Bouton "Ajouter un article"

**Cartes de statistiques :**

```powerapps
// Carte 1 : Articles différents
Text = CountRows(Articles)
Label = "Articles différents"

// Carte 2 : Unités totales
Text = Sum(Articles, Quantite)
Label = "Unités totales"

// Carte 3 : Articles en stock
Text = CountRows(Filter(Articles, Quantite > 0))
Label = "En stock"

// Carte 4 : Articles épuisés
Text = CountRows(Filter(Articles, Quantite = 0))
Label = "Épuisés"

// Carte 5 : Valeur totale
Text = Text(Sum(Articles, Quantite * PrixUnitaire), "[$-fr-CH] #,##0.00 CHF")
Label = "Valeur totale"
```

**Boutons :**

```powerapps
// Bouton "Voir tous les articles"
OnSelect = Navigate(EcranListeArticles, ScreenTransition.Fade)

// Bouton "Ajouter un article"
OnSelect = Navigate(EcranAjoutArticle, ScreenTransition.Cover)
```

### 2. EcranListeArticles

**Composants :**
- Barre de recherche
- Dropdown de filtrage par catégorie
- Galerie verticale des articles
- Bouton "+" pour ajouter

**Barre de recherche :**

```powerapps
// Nom du contrôle : txtRecherche
HintText = "🔍 Rechercher (nom, modèle, catégorie...)"
```

**Dropdown catégorie :**

```powerapps
// Nom du contrôle : ddCategorie
Items = Distinct(Articles, Categorie)
AllowEmptySelection = true
DefaultSelectedItems = Blank()
```

**Galerie des articles :**

```powerapps
// Nom du contrôle : galArticles
Items =
    If(
        IsBlank(txtRecherche.Text) && IsBlank(ddCategorie.Selected.Value),
        // Aucun filtre
        SortByColumns(Articles, "Nom", Ascending),
        // Avec filtres
        Filter(
            Articles,
            (IsBlank(txtRecherche.Text) ||
                txtRecherche.Text in Nom ||
                txtRecherche.Text in Modele ||
                txtRecherche.Text in Categorie ||
                txtRecherche.Text in NumeroSerie ||
                txtRecherche.Text in Emplacement
            ) &&
            (IsBlank(ddCategorie.Selected.Value) ||
                Categorie = ddCategorie.Selected.Value
            )
        )
    )

// Dans la galerie - Template :
// Photo (Label)
Text = If(IsBlank(ThisItem.Photo), "📦", ThisItem.Photo)
Size = 32

// Nom (Label)
Text = ThisItem.Nom
Font = Font.'Open Sans'
FontWeight = FontWeight.Semibold

// Modèle (Label)
Text = ThisItem.Modele
Color = RGBA(100, 100, 100, 1)
Size = 11

// Catégorie (Label)
Text = ThisItem.Categorie
Fill = Switch(
    ThisItem.Categorie,
    "Informatique", RGBA(227, 242, 253, 1),
    "Périphériques", RGBA(243, 229, 245, 1),
    "Écrans", RGBA(232, 245, 233, 1),
    "Connectique", RGBA(255, 243, 224, 1),
    "Alimentation", RGBA(252, 228, 236, 1),
    "Docking", RGBA(224, 242, 241, 1),
    "Audio", RGBA(241, 248, 233, 1),
    "Réseau", RGBA(225, 245, 254, 1),
    "Stockage", RGBA(237, 231, 246, 1),
    "Mobile", RGBA(255, 234, 179, 1),
    RGBA(240, 240, 240, 1)
)

// Stock (Label)
Text = ThisItem.Quantite & " unités"
Color = If(
    ThisItem.Quantite = 0, RGBA(114, 28, 36, 1),      // Rouge
    ThisItem.Quantite <= 5, RGBA(133, 100, 4, 1),     // Orange
    RGBA(21, 87, 36, 1)                               // Vert
)
Fill = If(
    ThisItem.Quantite = 0, RGBA(248, 215, 218, 1),   // Rouge clair
    ThisItem.Quantite <= 5, RGBA(255, 243, 205, 1),  // Orange clair
    RGBA(212, 237, 218, 1)                           // Vert clair
)

// OnSelect de la galerie
OnSelect =
    Set(varArticleSelectionne, ThisItem);
    Navigate(EcranDetailsArticle, ScreenTransition.Cover)
```

### 3. EcranDetailsArticle

**Composants :**
- Bouton retour
- Photo + Nom + Modèle
- Catégorie badge
- Détails de l'article (tous les champs)
- Stock actuel (grand)
- 4 boutons d'action

**OnVisible de l'écran :**

```powerapps
OnVisible =
    // Charger l'historique de l'article
    ClearCollect(
        colHistorique,
        Filter(
            HistoriqueStock,
            ItemID = varArticleSelectionne.ItemID
        )
    )
```

**Photo + Nom :**

```powerapps
// Photo
Text = If(IsBlank(varArticleSelectionne.Photo), "📦", varArticleSelectionne.Photo)
Size = 48

// Nom
Text = varArticleSelectionne.Nom

// Modèle
Text = varArticleSelectionne.Modele
```

**Détails :**

```powerapps
// Afficher conditionnellement selon si le champ est rempli
Visible = !IsBlank(varArticleSelectionne.NumeroSerie)
Text = "N° Série: " & varArticleSelectionne.NumeroSerie
// ... répéter pour chaque champ
```

**Stock actuel :**

```powerapps
Text = varArticleSelectionne.Quantite & " unités"
Size = 32
Color = If(
    varArticleSelectionne.Quantite = 0, RGBA(114, 28, 36, 1),
    varArticleSelectionne.Quantite <= 5, RGBA(133, 100, 4, 1),
    RGBA(21, 87, 36, 1)
)
```

**Boutons d'action :**

```powerapps
// Bouton "Ajuster le stock"
OnSelect = Navigate(EcranAjustementStock, ScreenTransition.Cover)

// Bouton "Voir l'historique"
OnSelect = Navigate(EcranHistorique, ScreenTransition.Cover)

// Bouton "Modifier"
OnSelect = Navigate(EcranModificationArticle, ScreenTransition.Cover)

// Bouton "Supprimer"
OnSelect =
    If(
        Confirm("Êtes-vous sûr de vouloir supprimer cet article ?"),
        Remove(Articles, varArticleSelectionne);
        // Supprimer aussi l'historique
        RemoveIf(HistoriqueStock, ItemID = varArticleSelectionne.ItemID);
        Navigate(EcranListeArticles, ScreenTransition.UnCover);
        Notify("Article supprimé avec succès", NotificationType.Success)
    )
```

### 4. EcranAjoutArticle

**Composants :**
- Formulaire Power Apps (EditForm)
- Bouton Annuler
- Bouton Enregistrer

**Formulaire :**

```powerapps
// Nom du contrôle : frmNouvelArticle
DataSource = Articles
Item = Defaults(Articles)
OnSuccess =
    // Ajouter l'historique initial si quantité > 0
    If(
        frmNouvelArticle.LastSubmit.Quantite > 0,
        Patch(
            HistoriqueStock,
            Defaults(HistoriqueStock),
            {
                ItemID: frmNouvelArticle.LastSubmit.ItemID,
                TypeMouvement: "Ajout",
                Quantite: frmNouvelArticle.LastSubmit.Quantite,
                QuantiteAvant: 0,
                QuantiteApres: frmNouvelArticle.LastSubmit.Quantite,
                NoteMouvement: "Stock initial",
                DateMouvement: Now()
            }
        )
    );
    Notify("Article ajouté avec succès", NotificationType.Success);
    Navigate(EcranListeArticles, ScreenTransition.UnCover)
```

**Champs du formulaire :**
- Nom (obligatoire)
- ItemID (généré automatiquement)
- Modèle
- Quantité (défaut : 0)
- Catégorie (dropdown)
- Numéro de série
- Emplacement
- Fournisseur
- Date d'achat
- Prix unitaire
- Photo (emoji)
- Notes

**Génération automatique de l'ItemID :**

```powerapps
// Dans la carte DataCard pour ItemID
Default = Text(Now(), "[$-en-US]yyyymmddhhmmss")
DisplayMode = DisplayMode.View // Non modifiable
```

**Boutons :**

```powerapps
// Bouton Annuler
OnSelect =
    ResetForm(frmNouvelArticle);
    Navigate(EcranListeArticles, ScreenTransition.UnCover)

// Bouton Enregistrer
OnSelect = SubmitForm(frmNouvelArticle)
DisplayMode = If(frmNouvelArticle.Valid, DisplayMode.Edit, DisplayMode.Disabled)
```

### 5. EcranModificationArticle

**Composants :**
- Formulaire (EditForm)
- Boutons Annuler et Enregistrer

```powerapps
// Formulaire
DataSource = Articles
Item = varArticleSelectionne
OnSuccess =
    Notify("Article modifié avec succès", NotificationType.Success);
    Navigate(EcranDetailsArticle, ScreenTransition.UnCover)

// Bouton Annuler
OnSelect =
    ResetForm(frmModification);
    Navigate(EcranDetailsArticle, ScreenTransition.UnCover)

// Bouton Enregistrer
OnSelect = SubmitForm(frmModification)
```

### 6. EcranAjustementStock

**Composants :**
- Info article (nom, photo, stock actuel)
- 2 boutons : "Ajouter" et "Retirer"
- Input quantité
- Input note
- Boutons Annuler et Confirmer

**Variables locales :**

```powerapps
// OnVisible de l'écran
OnVisible =
    Set(varTypeAjustement, "Ajout");
    Set(varQuantiteAjustement, 0);
    Set(varNoteAjustement, "")
```

**Stock actuel :**

```powerapps
Text = "Stock actuel: " & varArticleSelectionne.Quantite & " unités"
Size = 18
FontWeight = FontWeight.Bold
```

**Boutons Type :**

```powerapps
// Bouton "Ajouter"
OnSelect = Set(varTypeAjustement, "Ajout")
Fill = If(varTypeAjustement = "Ajout", RGBA(40, 167, 69, 1), RGBA(200, 200, 200, 1))

// Bouton "Retirer"
OnSelect = Set(varTypeAjustement, "Retrait")
Fill = If(varTypeAjustement = "Retrait", RGBA(220, 53, 69, 1), RGBA(200, 200, 200, 1))
```

**Input quantité :**

```powerapps
// Nom : txtQuantiteAjustement
Format = TextFormat.Number
Default = 0
Min = 1
```

**Input note :**

```powerapps
// Nom : txtNoteAjustement
Mode = TextMode.MultiLine
HintText = "Raison de l'ajustement (ex: Nouvelle commande reçue)"
```

**Bouton Confirmer :**

```powerapps
OnSelect =
    With(
        {
            quantiteActuelle: varArticleSelectionne.Quantite,
            quantiteModif: Value(txtQuantiteAjustement.Text)
        },
        // Vérification si retrait possible
        If(
            varTypeAjustement = "Retrait" && quantiteModif > quantiteActuelle,
            Notify("Impossible de retirer plus d'unités que le stock disponible", NotificationType.Error),

            // Calcul nouvelle quantité
            With(
                {
                    nouvelleQuantite: If(
                        varTypeAjustement = "Ajout",
                        quantiteActuelle + quantiteModif,
                        quantiteActuelle - quantiteModif
                    )
                },

                // Mise à jour de l'article
                Patch(
                    Articles,
                    varArticleSelectionne,
                    {Quantite: nouvelleQuantite}
                );

                // Ajout dans l'historique
                Patch(
                    HistoriqueStock,
                    Defaults(HistoriqueStock),
                    {
                        ItemID: varArticleSelectionne.ItemID,
                        TypeMouvement: varTypeAjustement,
                        Quantite: quantiteModif,
                        QuantiteAvant: quantiteActuelle,
                        QuantiteApres: nouvelleQuantite,
                        NoteMouvement: txtNoteAjustement.Text,
                        DateMouvement: Now()
                    }
                );

                // Mise à jour de la variable
                Set(varArticleSelectionne, LookUp(Articles, ItemID = varArticleSelectionne.ItemID));

                // Notification et navigation
                Notify("Stock ajusté avec succès", NotificationType.Success);
                Navigate(EcranDetailsArticle, ScreenTransition.UnCover)
            )
        )
    )

// Bouton Annuler
OnSelect = Navigate(EcranDetailsArticle, ScreenTransition.UnCover)
```

### 7. EcranHistorique

**Composants :**
- Titre avec nom de l'article
- Galerie verticale de l'historique

**Titre :**

```powerapps
Text = "Historique - " & varArticleSelectionne.Nom
```

**Galerie historique :**

```powerapps
// Nom : galHistorique
Items = SortByColumns(colHistorique, "DateMouvement", Descending)

// Dans la galerie - Icône
Text = If(ThisItem.TypeMouvement = "Ajout", "➕", "➖")

// Type de mouvement
Text = ThisItem.TypeMouvement & " de " & ThisItem.Quantite & " unité(s)"
Color = If(ThisItem.TypeMouvement = "Ajout", RGBA(40, 167, 69, 1), RGBA(220, 53, 69, 1))
FontWeight = FontWeight.Bold

// Détails
Text = "Stock: " & ThisItem.QuantiteAvant & " → " & ThisItem.QuantiteApres
Color = RGBA(100, 100, 100, 1)

// Note
Text = ThisItem.NoteMouvement
Visible = !IsBlank(ThisItem.NoteMouvement)
Fill = RGBA(255, 255, 255, 1)
BorderThickness = 1

// Date
Text = Text(ThisItem.DateMouvement, "dd mmmm yyyy à HH:mm", "fr-FR")
Color = RGBA(150, 150, 150, 1)
Size = 10
```

**Bouton retour :**

```powerapps
OnSelect = Navigate(EcranDetailsArticle, ScreenTransition.UnCover)
```

## Variables globales utilisées

```powerapps
// Variable pour l'article sélectionné
varArticleSelectionne : Record

// Variables pour l'ajustement de stock
varTypeAjustement : Text ("Ajout" ou "Retrait")
varQuantiteAjustement : Number
varNoteAjustement : Text

// Collection pour l'historique
colHistorique : Table
```

## Thème et couleurs

**Couleurs principales :**
- Primaire : RGBA(102, 126, 234, 1) - Bleu violet
- Secondaire : RGBA(118, 75, 162, 1) - Violet
- Succès : RGBA(40, 167, 69, 1) - Vert
- Danger : RGBA(220, 53, 69, 1) - Rouge
- Warning : RGBA(255, 193, 7, 1) - Jaune
- Info : RGBA(23, 162, 184, 1) - Cyan

**Catégories (fond des badges) :**
- Informatique : RGBA(227, 242, 253, 1)
- Périphériques : RGBA(243, 229, 245, 1)
- Écrans : RGBA(232, 245, 233, 1)
- Connectique : RGBA(255, 243, 224, 1)
- Alimentation : RGBA(252, 228, 236, 1)
- Docking : RGBA(224, 242, 241, 1)
- Audio : RGBA(241, 248, 233, 1)
- Réseau : RGBA(225, 245, 254, 1)
- Stockage : RGBA(237, 231, 246, 1)
- Mobile : RGBA(255, 234, 179, 1)

## Prochaines étapes

Consultez le fichier `POWERAPPS_CREATION_GUIDE.md` pour le guide étape par étape de création de l'application.

---

**Note importante :** Ce document contient toutes les formules Power Apps nécessaires. Vous devrez les copier-coller dans Power Apps Studio lors de la création de l'application.
