// Configuration SharePoint
// Remplacez ces valeurs par vos URLs SharePoint réelles

const SHAREPOINT_CONFIG = {
    // URL de votre site SharePoint (sans / à la fin)
    siteUrl: 'https://votretenant.sharepoint.com/sites/VotreSite',

    // Nom de la liste pour l'inventaire
    listNameInventaire: 'Inventaire',

    // Nom de la liste pour l'historique
    listNameHistorique: 'HistoriqueStock',

    // Mode debug (true pour afficher les logs dans la console)
    debug: true
};

// Mapping des colonnes entre l'application et SharePoint
const COLUMN_MAPPING = {
    // Application -> SharePoint
    'id': 'ItemID',
    'name': 'Title',
    'model': 'Modele',
    'quantity': 'Quantite',
    'category': 'Categorie',
    'serial': 'NumeroSerie',
    'location': 'Emplacement',
    'supplier': 'Fournisseur',
    'purchaseDate': 'DateAchat',
    'purchase_date': 'DateAchat',
    'price': 'PrixUnitaire',
    'photo': 'Photo',
    'notes': 'Notes'
};

// Mapping des catégories (en minuscules dans l'app -> format SharePoint)
const CATEGORY_MAPPING = {
    'informatique': 'Informatique',
    'peripheriques': 'Peripheriques',
    'ecrans': 'Ecrans',
    'connectique': 'Connectique',
    'alimentation': 'Alimentation',
    'docking': 'Docking',
    'audio': 'Audio',
    'reseau': 'Reseau',
    'stockage': 'Stockage',
    'mobile': 'Mobile'
};
