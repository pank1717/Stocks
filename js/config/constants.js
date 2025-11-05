/**
 * Application Constants
 * Category icons, labels, predefined locations, and role permissions
 */

// Category Icons Map
export const categoryIcons = {
    'informatique': '🖥️',
    'peripheriques': '🖱️',
    'ecrans': '📺',
    'connectique': '🔌',
    'alimentation': '🔋',
    'docking': '🔗',
    'audio': '🎧',
    'reseau': '📡',
    'stockage': '💾',
    'mobile': '📱'
};

// Category Labels Map
export const categoryLabels = {
    'informatique': 'Informatique',
    'peripheriques': 'Périphériques',
    'ecrans': 'Écrans',
    'connectique': 'Connectique',
    'alimentation': 'Alimentation',
    'docking': 'Docking & Hubs',
    'audio': 'Audio',
    'reseau': 'Réseau',
    'stockage': 'Stockage',
    'mobile': 'Mobile'
};

// Predefined Locations
export const predefinedLocations = [
    'Bureau IT - Armoire A',
    'Bureau IT - Armoire B',
    'Bureau IT - Armoire C',
    'Salle serveur',
    'Réception',
    'Salle de réunion 1',
    'Salle de réunion 2',
    'Atelier technique',
    'Entrepôt',
    'Stock sécurisé'
];

// Role permissions configuration
export const PERMISSIONS = {
    admin: {
        canAddItems: true,
        canEditItems: true,
        canDeleteItems: true,
        canAdjustStock: true,
        canExport: true,
        canPrintLabels: true,
        canManageSuppliers: true,
        canManageUsers: true,
        canViewHistory: true,
        canViewLoans: true
    },
    manager: {
        canAddItems: true,
        canEditItems: true,
        canDeleteItems: false,
        canAdjustStock: true,
        canExport: true,
        canPrintLabels: true,
        canManageSuppliers: true,
        canManageUsers: false,
        canViewHistory: true,
        canViewLoans: true
    },
    viewer: {
        canAddItems: false,
        canEditItems: false,
        canDeleteItems: false,
        canAdjustStock: false,
        canExport: true,
        canPrintLabels: false,
        canManageSuppliers: false,
        canManageUsers: false,
        canViewHistory: true,
        canViewLoans: true
    }
};

// Role labels and colors for UI
export const roleLabels = {
    'admin': 'Administrateur',
    'manager': 'Gestionnaire',
    'viewer': 'Lecteur'
};

export const roleColors = {
    'admin': '#dc3545',
    'manager': '#ffc107',
    'viewer': '#17a2b8'
};

// Session configuration
export const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
