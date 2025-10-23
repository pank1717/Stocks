# Guide de création Power Apps - Étape par Étape

## Temps estimé : 2-3 heures

Ce guide vous accompagne pas à pas dans la création de l'application de gestion de stock dans Power Apps.

## Prérequis

- Compte Microsoft 365 avec accès à Power Apps
- Licence Power Apps (incluse dans certains plans M365)
- Environnement Power Apps (créé automatiquement)

## Partie 1 : Création de la base de données (30 min)

### Choix 1 : Dataverse (Recommandé)

1. Allez sur [https://make.powerapps.com](https://make.powerapps.com)
2. Sélectionnez votre environnement
3. Dans le menu gauche, cliquez sur **Tables**
4. Cliquez sur **+ Nouvelle table** → **Définir les propriétés de la table**

#### Table 1 : Articles

**Propriétés de la table :**
- Nom d'affichage : `Articles`
- Nom pluriel : `Articles`
- Nom : `Article` (auto-généré)

**Créer les colonnes suivantes :**

| Nom | Type | Configuration |
|-----|------|---------------|
| Nom | Texte | Obligatoire, 100 caractères |
| ItemID | Texte | Obligatoire, 50 caractères |
| Modele | Texte | 200 caractères |
| Quantite | Nombre entier | Obligatoire, défaut 0 |
| Categorie | Choix | Obligatoire, voir ci-dessous |
| NumeroSerie | Texte | 100 caractères |
| Emplacement | Texte | 100 caractères |
| Fournisseur | Texte | 100 caractères |
| DateAchat | Date uniquement | |
| PrixUnitaire | Devise | CHF |
| Photo | Texte | 10 caractères |
| Notes | Texte multiligne | |

**Valeurs pour Categorie (Choix local) :**
1. Informatique
2. Périphériques
3. Écrans
4. Connectique
5. Alimentation
6. Docking
7. Audio
8. Réseau
9. Stockage
10. Mobile

**Enregistrez la table**

#### Table 2 : HistoriqueStock

**Propriétés de la table :**
- Nom d'affichage : `HistoriqueStock`
- Nom pluriel : `HistoriquesStock`

**Créer les colonnes suivantes :**

| Nom | Type | Configuration |
|-----|------|---------------|
| ItemID | Texte | Obligatoire, 50 caractères |
| TypeMouvement | Choix | "Ajout", "Retrait" |
| Quantite | Nombre entier | Obligatoire |
| QuantiteAvant | Nombre entier | Obligatoire |
| QuantiteApres | Nombre entier | Obligatoire |
| NoteMouvement | Texte multiligne | |
| DateMouvement | Date et heure | Obligatoire |

**Créer une relation (optionnel mais recommandé) :**
1. Dans la table HistoriqueStock, ajoutez une colonne
2. Type : **Recherche**
3. Nom : `Article`
4. Table associée : `Articles`
5. Cela créera automatiquement une relation 1-N

**Enregistrez la table**

### Choix 2 : SharePoint Lists (Alternative)

Si vous préférez utiliser SharePoint Lists, utilisez les listes déjà créées dans `SHAREPOINT_GUIDE.md`.

## Partie 2 : Création de l'application (2-2.5 heures)

### Étape 1 : Créer une nouvelle application (5 min)

1. Dans Power Apps ([make.powerapps.com](https://make.powerapps.com))
2. Cliquez sur **+ Créer**
3. Sélectionnez **Application vide**
4. Choisissez **Format Tablette** (meilleur pour cette app)
5. Nom : `Gestion Stock IT`
6. Cliquez sur **Créer**

### Étape 2 : Connecter les sources de données (2 min)

1. Dans Power Apps Studio, cliquez sur **Données** (icône cylindre) à gauche
2. Cliquez sur **+ Ajouter des données**
3. Recherchez et sélectionnez **Articles**
4. Répétez pour **HistoriqueStock**

### Étape 3 : Créer l'écran d'accueil (Dashboard) (20 min)

#### 3.1 Configurer l'écran

1. Renommez `Screen1` en `EcranAccueil`
2. Propriétés de l'écran :
   - **Fill** : `RGBA(102, 126, 234, 1)` (gradient viendra plus tard)

#### 3.2 Ajouter le titre

1. Insérez → **Label**
2. Propriétés :
   - **Text** : `"📦 Gestion de Stock IT"`
   - **X** : `40`
   - **Y** : `40`
   - **Size** : `32`
   - **Color** : `RGBA(255, 255, 255, 1)`
   - **FontWeight** : `FontWeight.Bold`

3. Ajoutez un deuxième label (sous-titre) :
   - **Text** : `"Gérez vos actifs informatiques en toute simplicité"`
   - **X** : `40`
   - **Y** : `85`
   - **Size** : `16`
   - **Color** : `RGBA(255, 255, 255, 0.9)`

#### 3.3 Créer les cartes statistiques

**Carte 1 : Articles différents**

1. Insérez → **Rectangle vertical**
   - **Nom** : `rectStat1`
   - **X** : `40`
   - **Y** : `150`
   - **Width** : `220`
   - **Height** : `120`
   - **Fill** : `RGBA(255, 255, 255, 1)`
   - **RadiusTopLeft** : `12`
   - **RadiusTopRight** : `12`
   - **RadiusBottomLeft** : `12`
   - **RadiusBottomRight** : `12`

2. Ajoutez un Label (icône) :
   - **Text** : `"📊"`
   - **Size** : `32`
   - **X** : `rectStat1.X + 20`
   - **Y** : `rectStat1.Y + 20`

3. Ajoutez un Label (valeur) :
   - **Text** : `CountRows(Articles)`
   - **Size** : `28`
   - **FontWeight** : `FontWeight.Bold`
   - **X** : `rectStat1.X + 70`
   - **Y** : `rectStat1.Y + 20`
   - **Color** : `RGBA(51, 51, 51, 1)`

4. Ajoutez un Label (libellé) :
   - **Text** : `"Articles différents"`
   - **Size** : `12`
   - **X** : `rectStat1.X + 20`
   - **Y** : `rectStat1.Y + 80`
   - **Color** : `RGBA(102, 102, 102, 1)`

**Répétez pour les 4 autres cartes :**

**Carte 2** (X: 280) :
- Icône : `"📦"`
- Valeur : `Sum(Articles, Quantite)`
- Libellé : `"Unités totales"`

**Carte 3** (X: 520) :
- Icône : `"✅"`
- Valeur : `CountRows(Filter(Articles, Quantite > 0))`
- Libellé : `"En stock"`

**Carte 4** (X: 760) :
- Icône : `"❌"`
- Valeur : `CountRows(Filter(Articles, Quantite = 0))`
- Libellé : `"Épuisés"`

**Carte 5** (X: 1000) :
- Icône : `"💰"`
- Valeur : `Text(Sum(Articles, Quantite * PrixUnitaire), "[$-fr-CH] #,##0.00 CHF")`
- Libellé : `"Valeur totale"`

#### 3.4 Ajouter les boutons

1. Insérez → **Bouton**
   - **Text** : `"Voir tous les articles"`
   - **X** : `40`
   - **Y** : `320`
   - **Width** : `250`
   - **Height** : `50`
   - **Fill** : `RGBA(76, 175, 80, 1)`
   - **Color** : `RGBA(255, 255, 255, 1)`
   - **OnSelect** : `Navigate(EcranListeArticles, ScreenTransition.Fade)`

2. Deuxième bouton :
   - **Text** : `"➕ Ajouter un article"`
   - **X** : `310`
   - **Y** : `320`
   - **OnSelect** : `Navigate(EcranAjoutArticle, ScreenTransition.Cover)`

### Étape 4 : Créer l'écran Liste Articles (30 min)

#### 4.1 Créer l'écran

1. Insérez → **Nouvel écran** → **Vide**
2. Renommez en `EcranListeArticles`
3. **Fill** : `RGBA(245, 245, 245, 1)`

#### 4.2 Ajouter la barre de navigation

1. Insérez → **Rectangle** (en haut)
   - **X** : `0`
   - **Y** : `0`
   - **Width** : `Parent.Width`
   - **Height** : `80`
   - **Fill** : `RGBA(102, 126, 234, 1)`

2. Bouton retour :
   - **Text** : `"←"`
   - **X** : `20`
   - **Y** : `15`
   - **Size** : `24`
   - **Color** : `RGBA(255, 255, 255, 1)`
   - **OnSelect** : `Navigate(EcranAccueil, ScreenTransition.Fade)`

3. Titre :
   - **Text** : `"Articles"`
   - **X** : `80`
   - **Y** : `20`
   - **Size** : `24`
   - **FontWeight** : `FontWeight.Bold`
   - **Color** : `RGBA(255, 255, 255, 1)`

#### 4.3 Ajouter la barre de recherche

1. Insérez → **Entrée de texte**
   - **Nom** : `txtRecherche`
   - **X** : `40`
   - **Y** : `100`
   - **Width** : `500`
   - **HintText** : `"🔍 Rechercher (nom, modèle, catégorie...)"`
   - **BorderRadius** : `8`

#### 4.4 Ajouter le filtre catégorie

1. Insérez → **Liste déroulante**
   - **Nom** : `ddCategorie`
   - **X** : `560`
   - **Y** : `100`
   - **Width** : `300`
   - **Items** : `Distinct(Articles, Categorie)`
   - **DefaultSelectedItems** : `Blank()`
   - **AllowEmptySelection** : `true`
   - **BorderRadius** : `8`

#### 4.5 Créer la galerie

1. Insérez → **Galerie verticale vide**
   - **Nom** : `galArticles`
   - **X** : `40`
   - **Y** : `160`
   - **Width** : `Parent.Width - 80`
   - **Height** : `Parent.Height - 200`
   - **TemplatePadding** : `10`
   - **TemplateSize** : `120`

2. **Items** (important, copiez exactement) :
```powerapps
If(
    IsBlank(txtRecherche.Text) && IsBlank(ddCategorie.Selected.Value),
    SortByColumns(Articles, "Nom", Ascending),
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
```

#### 4.6 Créer le template de la galerie

Sélectionnez la galerie et modifiez le premier élément :

1. Insérez un **Rectangle** :
   - **X** : `0`
   - **Y** : `0`
   - **Width** : `Parent.TemplateWidth`
   - **Height** : `Parent.TemplateHeight - 10`
   - **Fill** : `RGBA(255, 255, 255, 1)`
   - **RadiusTopLeft/Right/BottomLeft/Right** : `12`

2. **Label Photo** :
   - **Text** : `If(IsBlank(ThisItem.Photo), "📦", ThisItem.Photo)`
   - **Size** : `40`
   - **X** : `20`
   - **Y** : `25`

3. **Label Nom** :
   - **Text** : `ThisItem.Nom`
   - **X** : `90`
   - **Y** : `20`
   - **Size** : `16`
   - **FontWeight** : `FontWeight.Semibold`

4. **Label Modèle** :
   - **Text** : `ThisItem.Modele`
   - **X** : `90`
   - **Y** : `50`
   - **Size** : `12`
   - **Color** : `RGBA(100, 100, 100, 1)`

5. **Label Stock** (en haut à droite) :
   - **Text** : `ThisItem.Quantite & " unités"`
   - **X** : `Parent.TemplateWidth - 150`
   - **Y** : `35`
   - **Size** : `14`
   - **FontWeight** : `FontWeight.Bold`
   - **Fill** : Formule de couleur (voir POWERAPPS_ARCHITECTURE.md)
   - **Color** : Formule de couleur
   - **BorderRadius** : `12`
   - **PaddingTop/Bottom/Left/Right** : `8`

6. **OnSelect de la galerie** :
```powerapps
Set(varArticleSelectionne, ThisItem);
Navigate(EcranDetailsArticle, ScreenTransition.Cover)
```

#### 4.7 Bouton Ajouter (flottant)

1. Insérez → **Bouton**
   - **Text** : `"+"`
   - **X** : `Parent.Width - 100`
   - **Y** : `Parent.Height - 100`
   - **Width** : `60`
   - **Height** : `60`
   - **BorderRadius** : `30`
   - **Size** : `28`
   - **Fill** : `RGBA(76, 175, 80, 1)`
   - **OnSelect** : `Navigate(EcranAjoutArticle, ScreenTransition.Cover)`

### Étape 5 : Créer l'écran Détails Article (30 min)

#### 5.1 Créer l'écran

1. Nouvel écran vide → Renommer `EcranDetailsArticle`
2. **Fill** : `RGBA(245, 245, 245, 1)`

#### 5.2 OnVisible de l'écran

```powerapps
ClearCollect(
    colHistorique,
    Filter(
        HistoriqueStock,
        ItemID = varArticleSelectionne.ItemID
    )
)
```

#### 5.3 Barre de navigation

Même structure que EcranListeArticles avec :
- Bouton retour vers `EcranListeArticles`
- Titre : `"Détails"`

#### 5.4 Carte de l'article

1. **Rectangle principal** :
   - **X** : `40`
   - **Y** : `100`
   - **Width** : `Parent.Width - 80`
   - **Height** : `400`
   - **Fill** : `RGBA(255, 255, 255, 1)`
   - **BorderRadius** : `12`

2. **Photo** (grande) :
   - **Text** : `If(IsBlank(varArticleSelectionne.Photo), "📦", varArticleSelectionne.Photo)`
   - **Size** : `64`
   - **X** : `60`
   - **Y** : `120`

3. **Nom** :
   - **Text** : `varArticleSelectionne.Nom`
   - **X** : `150`
   - **Y** : `120`
   - **Size** : `24`
   - **FontWeight** : `FontWeight.Bold`

4. **Modèle** :
   - **Text** : `varArticleSelectionne.Modele`
   - **X** : `150`
   - **Y** : `160`
   - **Size** : `14`
   - **Color** : `RGBA(100, 100, 100, 1)`

5. **Catégorie Badge** :
   - **Text** : `varArticleSelectionne.Categorie`
   - **X** : `150`
   - **Y** : `190`
   - **Fill** : Formule Switch selon catégorie (voir POWERAPPS_ARCHITECTURE.md)
   - **BorderRadius** : `20`

6. **Stock actuel** (grand, au centre) :
   - **Text** : `varArticleSelectionne.Quantite & " unités"`
   - **X** : `60`
   - **Y** : `270`
   - **Size** : `32`
   - **FontWeight** : `FontWeight.Bold`
   - **Color** : Formule selon quantité (vert/orange/rouge)

7. **Détails** (colonnes) :
   - Créez des Labels pour chaque champ (N° série, Emplacement, Fournisseur, Prix, etc.)
   - Utilisez **Visible** : `!IsBlank(varArticleSelectionne.ChampX)` pour n'afficher que si rempli

#### 5.5 Boutons d'action

Créez 4 boutons en bas de la carte :

1. **Ajuster le stock** :
   - **OnSelect** : `Navigate(EcranAjustementStock, ScreenTransition.Cover)`
   - **Fill** : `RGBA(76, 175, 80, 1)` (vert)

2. **Voir l'historique** :
   - **OnSelect** : `Navigate(EcranHistorique, ScreenTransition.Cover)`
   - **Fill** : `RGBA(23, 162, 184, 1)` (cyan)

3. **Modifier** :
   - **OnSelect** : `Navigate(EcranModificationArticle, ScreenTransition.Cover)`
   - **Fill** : `RGBA(255, 193, 7, 1)` (jaune)

4. **Supprimer** :
   - **OnSelect** : Formule complète (voir POWERAPPS_ARCHITECTURE.md)
   - **Fill** : `RGBA(220, 53, 69, 1)` (rouge)

### Étape 6 : Créer l'écran Ajout Article (25 min)

#### 6.1 Créer l'écran

1. Nouvel écran → Renommer `EcranAjoutArticle`
2. **Fill** : `RGBA(245, 245, 245, 1)`

#### 6.2 Ajouter le formulaire

1. Insérez → **Formulaire de modification**
   - **Nom** : `frmNouvelArticle`
   - **DataSource** : `Articles`
   - **Item** : `Defaults(Articles)`
   - **X** : `40`
   - **Y** : `100`
   - **Width** : `Parent.Width - 80`

#### 6.3 Configurer le formulaire

1. Sélectionnez les champs à afficher (clic sur "Modifier les champs") :
   - Nom
   - ItemID
   - Modele
   - Quantite
   - Categorie
   - NumeroSerie
   - Emplacement
   - Fournisseur
   - DateAchat
   - PrixUnitaire
   - Photo
   - Notes

2. Pour le champ **ItemID** :
   - Dans les propriétés avancées de la carte
   - **Default** : `Text(Now(), "[$-en-US]yyyymmddhhmmss")`
   - **DisplayMode** : `DisplayMode.View` (non modifiable)

#### 6.4 OnSuccess du formulaire

```powerapps
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

#### 6.5 Boutons

1. **Annuler** :
   - **OnSelect** : `ResetForm(frmNouvelArticle); Navigate(EcranListeArticles, ScreenTransition.UnCover)`

2. **Enregistrer** :
   - **OnSelect** : `SubmitForm(frmNouvelArticle)`
   - **DisplayMode** : `If(frmNouvelArticle.Valid, DisplayMode.Edit, DisplayMode.Disabled)`

### Étape 7 : Créer l'écran Modification (15 min)

Même structure que EcranAjoutArticle avec :
- **Item du formulaire** : `varArticleSelectionne`
- **OnSuccess** : Navigation vers `EcranDetailsArticle`
- Pas de génération d'ItemID

### Étape 8 : Créer l'écran Ajustement Stock (30 min)

#### 8.1 Créer l'écran

1. Nouvel écran → `EcranAjustementStock`

#### 8.2 OnVisible

```powerapps
Set(varTypeAjustement, "Ajout");
Set(varQuantiteAjustement, 0);
Set(varNoteAjustement, "")
```

#### 8.3 Afficher l'article

Labels pour :
- Photo
- Nom
- **Stock actuel** : `"Stock actuel: " & varArticleSelectionne.Quantite & " unités"`

#### 8.4 Boutons Type d'ajustement

1. **Bouton Ajouter** :
   - **OnSelect** : `Set(varTypeAjustement, "Ajout")`
   - **Fill** : `If(varTypeAjustement = "Ajout", RGBA(40, 167, 69, 1), RGBA(200, 200, 200, 1))`

2. **Bouton Retirer** :
   - **OnSelect** : `Set(varTypeAjustement, "Retrait")`
   - **Fill** : `If(varTypeAjustement = "Retrait", RGBA(220, 53, 69, 1), RGBA(200, 200, 200, 1))`

#### 8.5 Inputs

1. **Quantité** :
   - Type : Entrée de texte numérique
   - **Nom** : `txtQuantiteAjustement`
   - **Format** : `TextFormat.Number`
   - **Default** : `0`

2. **Note** :
   - Type : Entrée de texte
   - **Nom** : `txtNoteAjustement`
   - **Mode** : `TextMode.MultiLine`
   - **HintText** : `"Raison de l'ajustement..."`

#### 8.6 Bouton Confirmer

**OnSelect** (formule complète - copier exactement) :

```powerapps
With(
    {
        quantiteActuelle: varArticleSelectionne.Quantite,
        quantiteModif: Value(txtQuantiteAjustement.Text)
    },
    If(
        varTypeAjustement = "Retrait" && quantiteModif > quantiteActuelle,
        Notify("Impossible de retirer plus d'unités que le stock disponible", NotificationType.Error),
        With(
            {
                nouvelleQuantite: If(
                    varTypeAjustement = "Ajout",
                    quantiteActuelle + quantiteModif,
                    quantiteActuelle - quantiteModif
                )
            },
            Patch(
                Articles,
                varArticleSelectionne,
                {Quantite: nouvelleQuantite}
            );
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
            Set(varArticleSelectionne, LookUp(Articles, ItemID = varArticleSelectionne.ItemID));
            Notify("Stock ajusté avec succès", NotificationType.Success);
            Navigate(EcranDetailsArticle, ScreenTransition.UnCover)
        )
    )
)
```

### Étape 9 : Créer l'écran Historique (20 min)

#### 9.1 Créer l'écran

1. Nouvel écran → `EcranHistorique`

#### 9.2 Titre

`"Historique - " & varArticleSelectionne.Nom`

#### 9.3 Galerie historique

1. Insérez → **Galerie verticale vide**
   - **Nom** : `galHistorique`
   - **Items** : `SortByColumns(colHistorique, "DateMouvement", Descending)`

2. Template de la galerie :
   - Rectangle blanc avec bordure
   - Label icône : `If(ThisItem.TypeMouvement = "Ajout", "➕", "➖")`
   - Label type : `ThisItem.TypeMouvement & " de " & ThisItem.Quantite & " unité(s)"`
   - Label détails : `"Stock: " & ThisItem.QuantiteAvant & " → " & ThisItem.QuantiteApres`
   - Label note : `ThisItem.NoteMouvement` (si présent)
   - Label date : `Text(ThisItem.DateMouvement, "dd mmmm yyyy à HH:mm", "fr-FR")`

### Étape 10 : Finalisation et tests (20 min)

#### 10.1 Ordre des écrans

Dans l'arborescence (Tree view), organisez les écrans dans cet ordre :
1. EcranAccueil
2. EcranListeArticles
3. EcranDetailsArticle
4. EcranAjoutArticle
5. EcranModificationArticle
6. EcranAjustementStock
7. EcranHistorique

#### 10.2 Définir l'écran de démarrage

1. Clic droit sur `EcranAccueil`
2. **Définir comme écran de démarrage**

#### 10.3 Tests

Testez chaque fonctionnalité :
- ✅ Ajouter un article
- ✅ Rechercher un article
- ✅ Filtrer par catégorie
- ✅ Voir les détails
- ✅ Modifier un article
- ✅ Ajuster le stock (ajout et retrait)
- ✅ Voir l'historique
- ✅ Supprimer un article

### Étape 11 : Ajouter des données d'exemple (10 min)

1. Allez dans `EcranAjoutArticle`
2. Ajoutez quelques articles manuellement
3. Ou importez depuis Excel (via Dataverse)

### Étape 12 : Publier l'application (5 min)

1. Cliquez sur **Fichier** → **Enregistrer**
2. Donnez une description de version
3. Cliquez sur **Publier**
4. **Publier cette version**

## Temps de développement total : ~3 heures

## Améliorations futures

Une fois l'application de base créée, vous pouvez ajouter :

1. **Notifications par email** (Power Automate)
   - Email quand stock bas
   - Email à la suppression

2. **Export Excel**
   - Bouton pour exporter les articles

3. **Permissions avancées**
   - Rôles (lecteur, contributeur, admin)

4. **Power BI**
   - Tableaux de bord avancés

5. **Scan de codes-barres**
   - Pour les numéros de série

6. **Photos réelles**
   - Remplacer les emojis par vraies photos

## Besoin d'aide ?

- Consultez `POWERAPPS_ARCHITECTURE.md` pour toutes les formules
- Documentation Microsoft : [https://docs.microsoft.com/power-apps](https://docs.microsoft.com/power-apps)
- Communauté Power Apps : [https://powerusers.microsoft.com](https://powerusers.microsoft.com)

---

**Félicitations! Vous avez créé votre application de gestion de stock dans Power Apps!** 🎉
