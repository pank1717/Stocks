// Data Storage
let items = [];
let currentAdjustmentType = 'add';
let currentStatusFilter = 'all';
let currentView = 'grid'; // 'grid' or 'list'
let currentTheme = localStorage.getItem('theme') || 'light';

// API Base URL
const API_URL = window.location.origin;

// Category Icons Map
const categoryIcons = {
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
const categoryLabels = {
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
const predefinedLocations = [
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

// Suppliers Management
let suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

// User Management & Permissions
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let users = JSON.parse(localStorage.getItem('users') || '[]');

// Initialize default admin user if no users exist
if (users.length === 0) {
    users.push({
        id: '1',
        username: 'admin',
        password: 'admin',  // In production, this should be hashed
        role: 'admin',
        email: 'admin@example.com',
        created: new Date().toISOString()
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// Role permissions configuration
const PERMISSIONS = {
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

function hasPermission(permission) {
    if (!currentUser) return false;
    return PERMISSIONS[currentUser.role]?.[permission] || false;
}

// Initialize currentUser as admin if not set (for demo purposes)
if (!currentUser) {
    currentUser = users[0]; // Default to admin
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function updateUserInterface() {
    // Update user info display
    const userInfo = document.getElementById('user-info');
    if (userInfo && currentUser) {
        const roleLabels = {
            'admin': 'Administrateur',
            'manager': 'Gestionnaire',
            'viewer': 'Lecteur'
        };
        const roleColors = {
            'admin': '#dc3545',
            'manager': '#ffc107',
            'viewer': '#17a2b8'
        };
        userInfo.innerHTML = `
            <span style="color: ${roleColors[currentUser.role]}; font-weight: bold;">
                👤 ${currentUser.username} (${roleLabels[currentUser.role]})
            </span>
        `;
    }

    // Show/hide buttons based on permissions
    const addItemBtn = document.querySelector('button[onclick="showAddItemModal()"]');
    if (addItemBtn) addItemBtn.style.display = hasPermission('canAddItems') ? 'inline-block' : 'none';

    const exportBtn = document.querySelector('button[onclick="exportToCSV()"]');
    if (exportBtn) exportBtn.style.display = hasPermission('canExport') ? 'inline-block' : 'none';

    const labelBtn = document.querySelector('button[onclick="showLabelPrintModal()"]');
    if (labelBtn) labelBtn.style.display = hasPermission('canPrintLabels') ? 'inline-block' : 'none';

    const suppliersBtn = document.querySelector('button[onclick="showSuppliersModal()"]');
    if (suppliersBtn) suppliersBtn.style.display = hasPermission('canManageSuppliers') ? 'inline-block' : 'none';

    const userManagementBtn = document.getElementById('user-management-btn');
    if (userManagementBtn) userManagementBtn.style.display = hasPermission('canManageUsers') ? 'inline-block' : 'none';
}

// Location Management
function handleLocationChange(prefix) {
    const selectElement = document.getElementById(`${prefix}-location-select`);
    const inputElement = document.getElementById(`${prefix}-location`);

    if (selectElement.value === '__other__') {
        inputElement.style.display = 'block';
        inputElement.required = true;
        inputElement.focus();
    } else {
        inputElement.style.display = 'none';
        inputElement.required = false;
        inputElement.value = selectElement.value;
    }
}

// Supplier Management
function handleSupplierChange(prefix) {
    const selectElement = document.getElementById(`${prefix}-supplier-select`);
    const inputElement = document.getElementById(`${prefix}-supplier`);

    if (selectElement.value === '__other__') {
        inputElement.style.display = 'block';
        inputElement.required = false;
        inputElement.focus();
    } else {
        inputElement.style.display = 'none';
        inputElement.required = false;
        inputElement.value = selectElement.value;
    }
}

function updateSupplierDropdowns() {
    const selects = document.querySelectorAll('#item-supplier-select, #edit-item-supplier-select');

    selects.forEach(select => {
        // Save current value
        const currentValue = select.value;

        // Clear options except first and last
        while (select.options.length > 2) {
            select.remove(1);
        }

        // Add supplier options
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.name;
            option.textContent = supplier.name;
            select.insertBefore(option, select.lastChild);
        });

        // Restore value if it exists
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function showSuppliersModal() {
    renderSuppliers();
    document.getElementById('suppliers-modal').classList.add('show');
}

function closeSuppliersModal() {
    document.getElementById('suppliers-modal').classList.remove('show');
}

function renderSuppliers() {
    const container = document.getElementById('suppliers-list');

    if (suppliers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun fournisseur enregistré</p>';
        return;
    }

    container.innerHTML = suppliers.map(supplier => `
        <div class="supplier-card">
            <div class="supplier-header">
                <div class="supplier-name">🏢 ${supplier.name}</div>
                <div class="supplier-actions">
                    <button class="btn btn-small btn-warning" onclick="editSupplier('${supplier.id}')">✏️ Modifier</button>
                    <button class="btn btn-small btn-danger" onclick="deleteSupplier('${supplier.id}')">🗑️ Supprimer</button>
                </div>
            </div>
            <div class="supplier-details">
                ${supplier.contact ? `<div><strong>Contact:</strong> ${supplier.contact}</div>` : ''}
                ${supplier.email ? `<div><strong>Email:</strong> <a href="mailto:${supplier.email}">${supplier.email}</a></div>` : ''}
                ${supplier.phone ? `<div><strong>Téléphone:</strong> <a href="tel:${supplier.phone}">${supplier.phone}</a></div>` : ''}
                ${supplier.website ? `<div><strong>Site web:</strong> <a href="${supplier.website}" target="_blank">${supplier.website}</a></div>` : ''}
                ${supplier.address ? `<div><strong>Adresse:</strong> ${supplier.address}</div>` : ''}
                ${supplier.notes ? `<div><strong>Notes:</strong> ${supplier.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function showAddSupplierModal() {
    document.getElementById('supplier-form-title').textContent = 'Ajouter un Fournisseur';
    document.getElementById('supplier-form').reset();
    document.getElementById('supplier-id').value = '';
    document.getElementById('supplier-form-modal').classList.add('show');
}

function closeSupplierFormModal() {
    document.getElementById('supplier-form-modal').classList.remove('show');
}

function editSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    document.getElementById('supplier-form-title').textContent = 'Modifier le Fournisseur';
    document.getElementById('supplier-id').value = supplier.id;
    document.getElementById('supplier-name').value = supplier.name;
    document.getElementById('supplier-contact').value = supplier.contact || '';
    document.getElementById('supplier-email').value = supplier.email || '';
    document.getElementById('supplier-phone').value = supplier.phone || '';
    document.getElementById('supplier-website').value = supplier.website || '';
    document.getElementById('supplier-address').value = supplier.address || '';
    document.getElementById('supplier-notes').value = supplier.notes || '';

    document.getElementById('supplier-form-modal').classList.add('show');
}

function saveSupplier(event) {
    event.preventDefault();

    const supplierId = document.getElementById('supplier-id').value;
    const supplierData = {
        name: document.getElementById('supplier-name').value,
        contact: document.getElementById('supplier-contact').value,
        email: document.getElementById('supplier-email').value,
        phone: document.getElementById('supplier-phone').value,
        website: document.getElementById('supplier-website').value,
        address: document.getElementById('supplier-address').value,
        notes: document.getElementById('supplier-notes').value
    };

    if (supplierId) {
        // Update existing supplier
        const index = suppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            suppliers[index] = { ...suppliers[index], ...supplierData };
            showToast('Succès', 'Fournisseur modifié avec succès', 'success');
        }
    } else {
        // Add new supplier
        const newSupplier = {
            id: Date.now().toString(),
            ...supplierData
        };
        suppliers.push(newSupplier);
        showToast('Succès', 'Fournisseur ajouté avec succès', 'success');
    }

    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    updateSupplierDropdowns();
    closeSupplierFormModal();
    renderSuppliers();
}

function deleteSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" ?`)) {
        suppliers = suppliers.filter(s => s.id !== supplierId);
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        updateSupplierDropdowns();
        renderSuppliers();
        showToast('Succès', 'Fournisseur supprimé avec succès', 'success');
    }
}

// User Management Functions
function showUserManagementModal() {
    if (!hasPermission('canManageUsers')) {
        showToast('Accès refusé', 'Seuls les administrateurs peuvent gérer les utilisateurs', 'error');
        return;
    }
    renderUsersTable();
    document.getElementById('user-management-modal').classList.add('show');
}

function closeUserManagementModal() {
    document.getElementById('user-management-modal').classList.remove('show');
}

function renderUsersTable() {
    const container = document.getElementById('users-table');

    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Aucun utilisateur</p>';
        return;
    }

    const roleLabels = {
        'admin': '👑 Administrateur',
        'manager': '👨‍💼 Gestionnaire',
        'viewer': '👁️ Lecteur'
    };

    const roleColors = {
        'admin': '#dc3545',
        'manager': '#ffc107',
        'viewer': '#17a2b8'
    };

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Utilisateur</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Rôle</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Créé le</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actuel</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px;"><strong>${user.username}</strong></td>
                        <td style="padding: 12px;">${user.email}</td>
                        <td style="padding: 12px;">
                            <span style="color: ${roleColors[user.role]}; font-weight: bold;">
                                ${roleLabels[user.role]}
                            </span>
                        </td>
                        <td style="padding: 12px; font-size: 0.85rem; color: #666;">
                            ${new Date(user.created).toLocaleDateString('fr-CH')}
                        </td>
                        <td style="padding: 12px;">
                            ${currentUser.id === user.id ? '✓ Connecté' : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function switchRole(role) {
    // Find or create a demo user with the specified role
    let demoUser = users.find(u => u.role === role && u.username.includes('demo'));

    if (!demoUser) {
        const roleNames = {
            'admin': 'demo_admin',
            'manager': 'demo_manager',
            'viewer': 'demo_viewer'
        };

        const roleEmails = {
            'admin': 'admin@demo.com',
            'manager': 'manager@demo.com',
            'viewer': 'viewer@demo.com'
        };

        demoUser = {
            id: Date.now().toString(),
            username: roleNames[role],
            password: 'demo',
            role: role,
            email: roleEmails[role],
            created: new Date().toISOString()
        };

        users.push(demoUser);
        localStorage.setItem('users', JSON.stringify(users));
    }

    currentUser = demoUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    updateUserInterface();
    renderItems(); // Re-render to apply permission changes to item cards
    renderUsersTable();

    const roleLabels = {
        'admin': 'Administrateur',
        'manager': 'Gestionnaire',
        'viewer': 'Lecteur'
    };

    showToast('Rôle changé', `Vous êtes maintenant connecté en tant que ${roleLabels[role]}`, 'success');
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeTheme();
    requestNotificationPermission();
    checkLowStockNotifications();
    updateSupplierDropdowns();
    updateUserInterface();
});

// API Functions
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/api/items`);
        if (!response.ok) throw new Error('Failed to load items');
        items = await response.json();

        // Get history for each item
        for (let item of items) {
            const historyResponse = await fetch(`${API_URL}/api/items/${item.id}/history`);
            if (historyResponse.ok) {
                item.history = await historyResponse.json();
            } else {
                item.history = [];
            }
        }

        renderItems();
        updateStatistics();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Erreur lors du chargement des données');
    }
}

async function saveItem(item) {
    try {
        const response = await fetch(`${API_URL}/api/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        });

        if (!response.ok) throw new Error('Failed to save item');
        return await response.json();
    } catch (error) {
        console.error('Error saving item:', error);
        showError('Erreur lors de l\'enregistrement de l\'article');
        throw error;
    }
}

async function updateItemAPI(itemId, itemData) {
    try {
        const response = await fetch(`${API_URL}/api/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) throw new Error('Failed to update item');
        return await response.json();
    } catch (error) {
        console.error('Error updating item:', error);
        showError('Erreur lors de la mise à jour de l\'article');
        throw error;
    }
}

async function deleteItemAPI(itemId) {
    try {
        const response = await fetch(`${API_URL}/api/items/${itemId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete item');
        return await response.json();
    } catch (error) {
        console.error('Error deleting item:', error);
        showError('Erreur lors de la suppression de l\'article');
        throw error;
    }
}

async function adjustStockAPI(itemId, adjustmentData) {
    try {
        const response = await fetch(`${API_URL}/api/items/${itemId}/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adjustmentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to adjust stock');
        }
        return await response.json();
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showError(error.message || 'Erreur lors de l\'ajustement du stock');
        throw error;
    }
}

// Modal Functions
function showAddItemModal() {
    document.getElementById('add-item-modal').classList.add('show');
    document.getElementById('add-item-form').reset();
}

function closeAddItemModal() {
    document.getElementById('add-item-modal').classList.remove('show');
}

function showEditItemModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-model').value = item.model || '';
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-serial').value = item.serial || '';

    // Handle location with predefined list
    const locationSelect = document.getElementById('edit-item-location-select');
    const locationInput = document.getElementById('edit-item-location');
    const currentLocation = item.location || '';

    if (predefinedLocations.includes(currentLocation)) {
        locationSelect.value = currentLocation;
        locationInput.style.display = 'none';
        locationInput.value = currentLocation;
    } else if (currentLocation) {
        locationSelect.value = '__other__';
        locationInput.style.display = 'block';
        locationInput.value = currentLocation;
    } else {
        locationSelect.value = '';
        locationInput.style.display = 'none';
        locationInput.value = '';
    }

    // Handle supplier with predefined list
    const supplierSelect = document.getElementById('edit-item-supplier-select');
    const supplierInput = document.getElementById('edit-item-supplier');
    const currentSupplier = item.supplier || '';
    const supplierNames = suppliers.map(s => s.name);

    if (supplierNames.includes(currentSupplier)) {
        supplierSelect.value = currentSupplier;
        supplierInput.style.display = 'none';
        supplierInput.value = currentSupplier;
    } else if (currentSupplier) {
        supplierSelect.value = '__other__';
        supplierInput.style.display = 'block';
        supplierInput.value = currentSupplier;
    } else {
        supplierSelect.value = '';
        supplierInput.style.display = 'none';
        supplierInput.value = '';
    }

    document.getElementById('edit-item-purchase-date').value = item.purchase_date || '';
    document.getElementById('edit-item-price').value = item.price || '';
    document.getElementById('edit-item-photo').value = item.photo || '';
    document.getElementById('edit-item-notes').value = item.notes || '';
    document.getElementById('edit-item-alert-threshold').value = item.alert_threshold || 5;

    document.getElementById('edit-item-modal').classList.add('show');
}

function closeEditItemModal() {
    document.getElementById('edit-item-modal').classList.remove('show');
}

function showAdjustStockModal(itemId, type = 'add', quickQuantity = null) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('adjust-item-id').value = item.id;
    document.getElementById('adjust-stock-form').reset();

    const infoHtml = `
        <div class="adjust-info-title">${item.photo || categoryIcons[item.category]} ${item.name}</div>
        <div class="adjust-info-current">Stock actuel: ${item.quantity} unités</div>
    `;
    document.getElementById('adjust-item-info').innerHTML = infoHtml;

    const adjustTypeGroup = document.getElementById('adjust-type-group');
    const quickTypeInfo = document.getElementById('quick-type-info');

    // Set adjustment type and quantity if quick action
    if (quickQuantity !== null) {
        // Mode action rapide - masquer les boutons de type et afficher le type fixe
        adjustTypeGroup.style.display = 'none';
        quickTypeInfo.style.display = 'block';
        const typeLabel = type === 'add' ? '➕ Ajout rapide' : '➖ Retrait rapide';
        const typeColor = type === 'add' ? '#28a745' : '#dc3545';
        quickTypeInfo.querySelector('.quick-type-display').innerHTML = `
            <div style="padding: 12px; background: ${type === 'add' ? '#d4edda' : '#f8d7da'};
                 color: ${typeColor}; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1rem;">
                ${typeLabel}
            </div>`;
        setAdjustmentType(type);
        document.getElementById('adjust-quantity').value = quickQuantity;
    } else {
        // Mode normal - afficher les boutons de type
        adjustTypeGroup.style.display = 'block';
        quickTypeInfo.style.display = 'none';
        setAdjustmentType(type);
    }

    document.getElementById('adjust-stock-modal').classList.add('show');
}

function closeAdjustStockModal() {
    document.getElementById('adjust-stock-modal').classList.remove('show');
}

let historyChart = null;

function showHistoryModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Generate chart
    if (item.history && item.history.length > 0) {
        createHistoryChart(item);
    }

    // Generate history list
    let historyHtml = `<div class="history-list">`;

    if (!item.history || item.history.length === 0) {
        historyHtml += `<div class="empty-state"><p>Aucun mouvement enregistré pour cet article.</p></div>`;
    } else {
        // Sort history by date (newest first)
        const sortedHistory = [...item.history].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedHistory.forEach(entry => {
            const icon = entry.type === 'add' ? '➕' : '➖';
            const typeClass = entry.type === 'add' ? 'add' : 'remove';
            const typeLabel = entry.type === 'add' ? 'Ajout' : 'Retrait';

            historyHtml += `
                <div class="history-item">
                    <div class="history-icon">${icon}</div>
                    <div class="history-content">
                        <div class="history-type ${typeClass}">${typeLabel} de ${entry.quantity} unité(s)</div>
                        <div class="history-details">
                            Stock: ${entry.previous_quantity} → ${entry.new_quantity}
                        </div>
                        ${entry.person ? `<div class="history-person">👤 Donné à: <strong>${entry.person}</strong></div>` : ''}
                        ${entry.expected_return_date ? `<div class="history-return-date">📅 Retour prévu: <strong>${formatDate(entry.expected_return_date)}</strong></div>` : ''}
                        ${entry.note ? `<div class="history-note">${entry.note}</div>` : ''}
                        <div class="history-date">${formatDate(entry.date)}</div>
                    </div>
                </div>
            `;
        });
    }

    historyHtml += `</div>`;
    document.getElementById('history-content').innerHTML = historyHtml;
    document.getElementById('history-modal').classList.add('show');
}

function createHistoryChart(item) {
    // Destroy previous chart if exists
    if (historyChart) {
        historyChart.destroy();
    }

    // Sort history by date (oldest first for chart)
    const sortedHistory = [...item.history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare data
    const labels = sortedHistory.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
    });

    const stockData = sortedHistory.map(entry => entry.new_quantity);

    // Create chart
    const ctx = document.getElementById('history-chart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantité en stock',
                data: stockData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const entry = sortedHistory[context.dataIndex];
                            const type = entry.type === 'add' ? 'Ajout' : 'Retrait';
                            return `${type} de ${entry.quantity} unité(s)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Quantité'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

function closeHistoryModal() {
    document.getElementById('history-modal').classList.remove('show');
}

function setAdjustmentType(type) {
    currentAdjustmentType = type;

    // Show/hide person and return date fields based on adjustment type
    const personGroup = document.getElementById('adjust-person-group');
    const personInput = document.getElementById('adjust-person');
    const returnDateGroup = document.getElementById('adjust-return-date-group');
    const returnDateInput = document.getElementById('adjust-return-date');

    if (type === 'remove') {
        personGroup.style.display = 'block';
        personInput.required = true;
        returnDateGroup.style.display = 'block';

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        returnDateInput.min = today;
    } else {
        personGroup.style.display = 'none';
        personInput.required = false;
        personInput.value = '';
        returnDateGroup.style.display = 'none';
        returnDateInput.value = '';
    }
}

// Item Management Functions
async function addItem(event) {
    event.preventDefault();

    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('item-name').value,
        model: document.getElementById('item-model').value,
        quantity: parseInt(document.getElementById('item-quantity').value) || 0,
        category: document.getElementById('item-category').value,
        serial: document.getElementById('item-serial').value,
        location: document.getElementById('item-location').value,
        supplier: document.getElementById('item-supplier').value,
        purchaseDate: document.getElementById('item-purchase-date').value,
        price: parseFloat(document.getElementById('item-price').value) || 0,
        photo: document.getElementById('item-photo').value,
        notes: document.getElementById('item-notes').value,
        alertThreshold: parseInt(document.getElementById('item-alert-threshold').value) || 5
    };

    try {
        await saveItem(newItem);
        await loadData();
        closeAddItemModal();
        showSuccess('Article ajouté avec succès');
    } catch (error) {
        // Error already handled in saveItem
    }
}

async function updateItem(event) {
    event.preventDefault();

    const itemId = document.getElementById('edit-item-id').value;

    const itemData = {
        name: document.getElementById('edit-item-name').value,
        model: document.getElementById('edit-item-model').value,
        category: document.getElementById('edit-item-category').value,
        serial: document.getElementById('edit-item-serial').value,
        location: document.getElementById('edit-item-location').value,
        supplier: document.getElementById('edit-item-supplier').value,
        purchaseDate: document.getElementById('edit-item-purchase-date').value,
        price: parseFloat(document.getElementById('edit-item-price').value) || 0,
        photo: document.getElementById('edit-item-photo').value,
        notes: document.getElementById('edit-item-notes').value,
        alertThreshold: parseInt(document.getElementById('edit-item-alert-threshold').value) || 5
    };

    try {
        await updateItemAPI(itemId, itemData);
        await loadData();
        closeEditItemModal();
        showSuccess('Article modifié avec succès');
    } catch (error) {
        // Error already handled in updateItemAPI
    }
}

async function deleteItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
        try {
            await deleteItemAPI(itemId);
            await loadData();
            showSuccess('Article supprimé avec succès');
        } catch (error) {
            // Error already handled in deleteItemAPI
        }
    }
}

async function adjustStock(event) {
    event.preventDefault();

    const itemId = document.getElementById('adjust-item-id').value;
    const quantity = parseInt(document.getElementById('adjust-quantity').value) || 0;
    const note = document.getElementById('adjust-note').value;
    const person = document.getElementById('adjust-person').value;
    const returnDate = document.getElementById('adjust-return-date').value;

    const adjustmentData = {
        type: currentAdjustmentType,
        quantity: quantity,
        note: note,
        person: person || null,
        expectedReturnDate: returnDate || null
    };

    try {
        await adjustStockAPI(itemId, adjustmentData);
        await loadData();
        closeAdjustStockModal();
        showSuccess('Stock ajusté avec succès');
    } catch (error) {
        // Error already handled in adjustStockAPI
    }
}

// Rendering Functions
function renderItems() {
    const container = document.getElementById('items-container');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>Aucun article dans l'inventaire</h3>
                <p>Cliquez sur "Ajouter un Article" pour commencer</p>
            </div>
        `;
        return;
    }

    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const sortOption = document.getElementById('sort-select').value;

    let filteredItems = items.filter(item => {
        const matchesSearch = !searchTerm ||
            item.name.toLowerCase().includes(searchTerm) ||
            (item.model && item.model.toLowerCase().includes(searchTerm)) ||
            (item.serial && item.serial.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm)) ||
            categoryLabels[item.category].toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || item.category === categoryFilter;

        // Status filter
        const alertThreshold = item.alert_threshold || 5;
        let matchesStatus = true;

        if (currentStatusFilter === 'in-stock') {
            matchesStatus = item.quantity > 0;
        } else if (currentStatusFilter === 'out-stock') {
            matchesStatus = item.quantity === 0;
        } else if (currentStatusFilter === 'low-stock') {
            matchesStatus = item.quantity > 0 && item.quantity <= alertThreshold;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Apply sorting
    filteredItems = sortItems(filteredItems, sortOption);

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        return;
    }

    // Update view class on container
    container.className = `items-section items-${currentView}`;

    container.innerHTML = filteredItems.map(item => {
        const alertThreshold = item.alert_threshold || 5;
        const isLowStock = item.quantity > 0 && item.quantity <= alertThreshold;

        const stockClass = item.quantity === 0 ? 'stock-out' :
                          isLowStock ? 'stock-low' : 'stock-available';

        const stockLabel = item.quantity === 0 ? 'Épuisé' :
                          item.quantity === 1 ? '1 unité' :
                          `${item.quantity} unités`;

        const photo = item.photo || categoryIcons[item.category] || '📦';

        // Calculate days since last movement
        let daysSinceLastMovement = null;
        let isInactive = false;
        if (item.history && item.history.length > 0) {
            const lastMovement = new Date(item.history[0].date);
            const today = new Date();
            daysSinceLastMovement = Math.floor((today - lastMovement) / (1000 * 60 * 60 * 24));
            isInactive = daysSinceLastMovement > 90; // Inactive if no movement for 90+ days
        }

        return `
            <div class="item-card ${isLowStock ? 'item-low-stock' : ''}">
                ${isLowStock ? '<div class="low-stock-badge">⚠️ Stock faible</div>' : ''}
                ${isInactive ? `<div class="inactive-badge">💤 Inactif depuis ${daysSinceLastMovement} jours</div>` : ''}
                <div class="item-header">
                    <div class="item-photo">${photo}</div>
                    <div class="item-title-section">
                        <div class="item-name">${item.name}</div>
                        ${item.model ? `<div class="item-model">${item.model}</div>` : ''}
                        <div class="item-category category-${item.category}">
                            ${categoryIcons[item.category]} ${categoryLabels[item.category]}
                        </div>
                    </div>
                </div>

                <div class="item-details">
                    ${item.serial ? `
                        <div class="item-detail-row">
                            <span class="item-detail-label">N° Série:</span>
                            <span>${item.serial}</span>
                        </div>
                    ` : ''}
                    ${item.location ? `
                        <div class="item-detail-row">
                            <span class="item-detail-label">Emplacement:</span>
                            <span>${item.location}</span>
                        </div>
                    ` : ''}
                    ${item.supplier ? `
                        <div class="item-detail-row">
                            <span class="item-detail-label">Fournisseur:</span>
                            <span>${item.supplier}</span>
                        </div>
                    ` : ''}
                    ${item.price > 0 ? `
                        <div class="item-detail-row">
                            <span class="item-detail-label">Prix unitaire:</span>
                            <span>${formatPrice(item.price)}</span>
                        </div>
                    ` : ''}
                    ${item.notes ? `
                        <div class="item-detail-row">
                            <span class="item-detail-label">Notes:</span>
                            <span>${item.notes}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="item-stock ${stockClass}">
                    ${stockLabel}
                </div>

                ${hasPermission('canAdjustStock') ? `
                    <div class="quick-actions">
                        <button class="btn btn-success btn-quick" onclick="showAdjustStockModal('${item.id}', 'add', 1)" title="Ajouter 1 unité">
                            ➕
                        </button>
                        <button class="btn btn-danger btn-quick" onclick="showAdjustStockModal('${item.id}', 'remove', 1)" title="Retirer 1 unité">
                            ➖
                        </button>
                    </div>
                ` : ''}

                <div class="item-actions">
                    ${hasPermission('canAdjustStock') ? `
                        <button class="btn btn-success btn-small" onclick="showAdjustStockModal('${item.id}')">
                            📊 Ajuster
                        </button>
                    ` : ''}
                    ${hasPermission('canViewHistory') ? `
                        <button class="btn btn-info btn-small" onclick="showHistoryModal('${item.id}')">
                            📜 Historique
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-small" onclick="showQRCodeModal('${item.id}')">
                        🔲 QR Code
                    </button>
                    ${hasPermission('canEditItems') ? `
                        <button class="btn btn-warning btn-small" onclick="showEditItemModal('${item.id}')">
                            ✏️ Modifier
                        </button>
                    ` : ''}
                    ${hasPermission('canDeleteItems') ? `
                        <button class="btn btn-danger btn-small" onclick="deleteItem('${item.id}')">
                            🗑️ Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterItems() {
    renderItems();
}

// Sorting Function
function sortItems(items, sortOption) {
    const sorted = [...items];

    switch (sortOption) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'quantity-asc':
            return sorted.sort((a, b) => a.quantity - b.quantity);
        case 'quantity-desc':
            return sorted.sort((a, b) => b.quantity - a.quantity);
        case 'price-asc':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-desc':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'category':
            return sorted.sort((a, b) => {
                if (a.category === b.category) {
                    return a.name.localeCompare(b.name);
                }
                return categoryLabels[a.category].localeCompare(categoryLabels[b.category]);
            });
        case 'recent':
            return sorted.sort((a, b) => {
                const aDate = a.history && a.history.length > 0 ? new Date(a.history[0].date) : new Date(0);
                const bDate = b.history && b.history.length > 0 ? new Date(b.history[0].date) : new Date(0);
                return bDate - aDate;
            });
        case 'oldest':
            return sorted.sort((a, b) => {
                const aDate = a.history && a.history.length > 0 ? new Date(a.history[0].date) : new Date();
                const bDate = b.history && b.history.length > 0 ? new Date(b.history[0].date) : new Date();
                return aDate - bDate;
            });
        default:
            return sorted;
    }
}

function updateStatistics() {
    const totalItems = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const inStock = items.filter(item => item.quantity > 0).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const lowStock = items.filter(item => {
        const alertThreshold = item.alert_threshold || 5;
        return item.quantity > 0 && item.quantity <= alertThreshold;
    }).length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

    document.getElementById('stat-items').textContent = totalItems;
    document.getElementById('stat-units').textContent = totalUnits;
    document.getElementById('stat-in-stock').textContent = inStock;
    document.getElementById('stat-out-stock').textContent = outOfStock;
    document.getElementById('stat-low-stock').textContent = lowStock;
    document.getElementById('stat-value').textContent = formatPrice(totalValue);

    // Update stat card active states
    document.querySelectorAll('.stat-card[data-filter]').forEach(card => {
        const filter = card.getAttribute('data-filter');
        if (filter === currentStatusFilter) {
            card.classList.add('stat-card-active');
        } else {
            card.classList.remove('stat-card-active');
        }
    });

    // Update category statistics
    updateCategoryStatistics();
}

function updateCategoryStatistics() {
    const categoryStats = {};

    // Initialize all categories
    Object.keys(categoryLabels).forEach(cat => {
        categoryStats[cat] = {
            count: 0,
            totalUnits: 0,
            totalValue: 0
        };
    });

    // Calculate stats per category
    items.forEach(item => {
        const cat = item.category;
        if (categoryStats[cat]) {
            categoryStats[cat].count++;
            categoryStats[cat].totalUnits += item.quantity;
            categoryStats[cat].totalValue += (item.quantity * (item.price || 0));
        }
    });

    // Render category stats
    const container = document.getElementById('category-stats-content');
    const sortedCategories = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.totalValue - a.totalValue)
        .filter(([, stats]) => stats.count > 0);

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Aucune donnée disponible</p>';
        return;
    }

    container.innerHTML = sortedCategories.map(([cat, stats]) => `
        <div class="category-stat-card">
            <div class="category-stat-icon">${categoryIcons[cat]}</div>
            <div class="category-stat-content">
                <div class="category-stat-name">${categoryLabels[cat]}</div>
                <div class="category-stat-details">
                    <div class="category-stat-row">
                        <span>Articles:</span>
                        <strong>${stats.count}</strong>
                    </div>
                    <div class="category-stat-row">
                        <span>Unités:</span>
                        <strong>${stats.totalUnits}</strong>
                    </div>
                    <div class="category-stat-row">
                        <span>Valeur:</span>
                        <strong>${formatPrice(stats.totalValue)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Status Filter Functions
function filterByStatus(status) {
    currentStatusFilter = status;

    // Reset search and category filters
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';

    renderItems();
    updateStatistics();

    // Show alerts section if low-stock filter is selected
    if (status === 'low-stock') {
        showAlerts();
    } else {
        closeAlerts();
    }
}

function showAlerts() {
    const alertsSection = document.getElementById('alerts-section');
    const alertsContent = document.getElementById('alerts-content');

    const lowStockItems = items.filter(item => {
        const alertThreshold = item.alert_threshold || 5;
        return item.quantity > 0 && item.quantity <= alertThreshold;
    });

    if (lowStockItems.length === 0) {
        alertsContent.innerHTML = '<p style="text-align: center; color: #666;">Aucune alerte de stock faible</p>';
    } else {
        alertsContent.innerHTML = lowStockItems.map(item => {
            const photo = item.photo || categoryIcons[item.category] || '📦';
            const alertThreshold = item.alert_threshold || 5;

            return `
                <div class="alert-item">
                    <div class="alert-icon">${photo}</div>
                    <div class="alert-content">
                        <div class="alert-name">${item.name}</div>
                        <div class="alert-details">
                            Stock actuel: <strong>${item.quantity}</strong> / Seuil: <strong>${alertThreshold}</strong>
                        </div>
                    </div>
                    <button class="btn btn-success btn-small" onclick="showAdjustStockModal('${item.id}')">
                        Réapprovisionner
                    </button>
                </div>
            `;
        }).join('');
    }

    alertsSection.style.display = 'block';
}

function closeAlerts() {
    document.getElementById('alerts-section').style.display = 'none';
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('fr-CH', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 2
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showSuccess(message) {
    showToast('Succès', message, 'success');
}

function showError(message) {
    showToast('Erreur', message, 'error');
}

// Loans Management Functions
let allLoans = [];

function showLoansModal() {
    loadLoans();
    document.getElementById('loans-modal').classList.add('show');
}

function closeLoansModal() {
    document.getElementById('loans-modal').classList.remove('show');
}

function loadLoans() {
    // Collect all loans from history (removals with person)
    allLoans = [];

    items.forEach(item => {
        if (item.history && item.history.length > 0) {
            item.history.forEach(entry => {
                if (entry.type === 'remove' && entry.person) {
                    allLoans.push({
                        itemId: item.id,
                        itemName: item.name,
                        itemPhoto: item.photo || categoryIcons[item.category],
                        person: entry.person,
                        quantity: entry.quantity,
                        date: entry.date,
                        expectedReturnDate: entry.expected_return_date,
                        note: entry.note
                    });
                }
            });
        }
    });

    // Sort by date (newest first)
    allLoans.sort((a, b) => new Date(b.date) - new Date(a.date));

    filterLoans();
}

function filterLoans() {
    const searchTerm = document.getElementById('loans-search-input').value.toLowerCase();
    const statusFilter = document.getElementById('loans-status-filter').value;
    const container = document.getElementById('loans-content');

    let filteredLoans = allLoans.filter(loan => {
        const matchesSearch = !searchTerm || loan.person.toLowerCase().includes(searchTerm);

        let matchesStatus = true;
        if (statusFilter === 'active') {
            // Active: has expected return date and not overdue, or no return date
            if (loan.expectedReturnDate) {
                const returnDate = new Date(loan.expectedReturnDate);
                const today = new Date();
                matchesStatus = returnDate >= today;
            }
        } else if (statusFilter === 'overdue') {
            // Overdue: has expected return date and is past due
            if (loan.expectedReturnDate) {
                const returnDate = new Date(loan.expectedReturnDate);
                const today = new Date();
                matchesStatus = returnDate < today;
            } else {
                matchesStatus = false;
            }
        }

        return matchesSearch && matchesStatus;
    });

    if (filteredLoans.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="color: #666;">
                <div class="empty-state-icon">📦</div>
                <h3>Aucun prêt trouvé</h3>
                <p>Aucun article n'a été prêté avec les critères sélectionnés</p>
            </div>
        `;
        return;
    }

    // Group loans by person
    const loansByPerson = {};
    filteredLoans.forEach(loan => {
        if (!loansByPerson[loan.person]) {
            loansByPerson[loan.person] = [];
        }
        loansByPerson[loan.person].push(loan);
    });

    let html = '<div class="loans-list">';

    Object.entries(loansByPerson).forEach(([person, loans]) => {
        const totalItems = loans.reduce((sum, loan) => sum + loan.quantity, 0);

        html += `
            <div class="loan-person-group">
                <div class="loan-person-header">
                    <div class="loan-person-name">👤 ${person}</div>
                    <div class="loan-person-stats">${loans.length} article(s) • ${totalItems} unité(s)</div>
                </div>
                <div class="loan-items-list">
        `;

        loans.forEach(loan => {
            const isOverdue = loan.expectedReturnDate && new Date(loan.expectedReturnDate) < new Date();
            const returnDateStr = loan.expectedReturnDate
                ? `📅 Retour prévu: ${formatDate(loan.expectedReturnDate)}`
                : '📅 Pas de date de retour';

            html += `
                <div class="loan-item ${isOverdue ? 'loan-overdue' : ''}">
                    <div class="loan-item-icon">${loan.itemPhoto}</div>
                    <div class="loan-item-content">
                        <div class="loan-item-name">${loan.itemName}</div>
                        <div class="loan-item-details">
                            <div>${loan.quantity} unité(s) • Prêté le ${formatDate(loan.date)}</div>
                            <div class="${isOverdue ? 'loan-overdue-text' : ''}">${returnDateStr}</div>
                            ${loan.note ? `<div class="loan-item-note">${loan.note}</div>` : ''}
                        </div>
                    </div>
                    ${isOverdue ? '<div class="loan-overdue-badge">⚠️ En retard</div>' : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';

    container.innerHTML = html;
}

// QR Code Functions
let currentQRCodeItem = null;

function showQRCodeModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    currentQRCodeItem = item;

    // Display item info
    const photo = item.photo || categoryIcons[item.category] || '📦';
    const infoHtml = `
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
            ${photo} ${item.name}
        </div>
        ${item.model ? `<div style="color: #666; margin-bottom: 5px;">${item.model}</div>` : ''}
        <div style="color: #666; margin-bottom: 5px;">Stock: ${item.quantity} unités</div>
        ${item.serial ? `<div style="color: #666;">N° Série: ${item.serial}</div>` : ''}
    `;
    document.getElementById('qrcode-item-info').innerHTML = infoHtml;

    // Generate QR code data
    const qrData = JSON.stringify({
        id: item.id,
        name: item.name,
        model: item.model || '',
        serial: item.serial || '',
        category: item.category,
        location: item.location || '',
        url: window.location.href
    });

    // Clear previous QR code
    const qrcodeDisplay = document.getElementById('qrcode-display');
    qrcodeDisplay.innerHTML = '';

    // Generate new QR code
    QRCode.toCanvas(qrData, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (error, canvas) => {
        if (error) {
            console.error('Error generating QR code:', error);
            qrcodeDisplay.innerHTML = '<p style="color: red;">Erreur lors de la génération du code QR</p>';
            return;
        }
        qrcodeDisplay.appendChild(canvas);
    });

    document.getElementById('qrcode-modal').classList.add('show');
}

function closeQRCodeModal() {
    document.getElementById('qrcode-modal').classList.remove('show');
    currentQRCodeItem = null;
}

function printQRCode() {
    if (!currentQRCodeItem) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    const photo = currentQRCodeItem.photo || categoryIcons[currentQRCodeItem.category] || '📦';
    const canvas = document.querySelector('#qrcode-display canvas');

    if (!canvas) {
        alert('Code QR non généré');
        return;
    }

    const qrImageData = canvas.toDataURL();

    printWindow.document.write(`
        <html>
        <head>
            <title>Code QR - ${currentQRCodeItem.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                }
                .qr-label {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .qr-label h2 {
                    margin: 10px 0;
                }
                .qr-label .emoji {
                    font-size: 3rem;
                }
                img {
                    border: 2px solid #333;
                    padding: 10px;
                }
                .info {
                    margin-top: 20px;
                    text-align: center;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="qr-label">
                <div class="emoji">${photo}</div>
                <h2>${currentQRCodeItem.name}</h2>
                ${currentQRCodeItem.model ? `<p>${currentQRCodeItem.model}</p>` : ''}
                ${currentQRCodeItem.serial ? `<p>N° Série: ${currentQRCodeItem.serial}</p>` : ''}
            </div>
            <img src="${qrImageData}" alt="QR Code" />
            <div class="info">
                <p>Catégorie: ${categoryLabels[currentQRCodeItem.category]}</p>
                ${currentQRCodeItem.location ? `<p>Emplacement: ${currentQRCodeItem.location}</p>` : ''}
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function downloadQRCode() {
    if (!currentQRCodeItem) return;

    const canvas = document.querySelector('#qrcode-display canvas');

    if (!canvas) {
        alert('Code QR non généré');
        return;
    }

    const link = document.createElement('a');
    link.download = `qrcode_${currentQRCodeItem.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// Label Printing Functions
let selectedLabelItems = new Set();

function showLabelPrintModal() {
    selectedLabelItems.clear();
    renderLabelItems();
    document.getElementById('label-print-modal').classList.add('show');
}

function closeLabelPrintModal() {
    document.getElementById('label-print-modal').classList.remove('show');
}

function renderLabelItems() {
    const container = document.getElementById('label-items-grid');

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Aucun article disponible</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        const photo = item.photo || categoryIcons[item.category] || '📦';
        const isSelected = selectedLabelItems.has(item.id);

        return `
            <div class="label-item-card ${isSelected ? 'selected' : ''}" onclick="toggleLabelSelection('${item.id}')">
                <div class="label-item-photo">${photo}</div>
                <div class="label-item-name">${item.name}</div>
                <div class="label-item-details">
                    ${item.model || ''}<br>
                    Stock: ${item.quantity}
                </div>
            </div>
        `;
    }).join('');
}

function toggleLabelSelection(itemId) {
    if (selectedLabelItems.has(itemId)) {
        selectedLabelItems.delete(itemId);
    } else {
        selectedLabelItems.add(itemId);
    }
    renderLabelItems();
}

function selectAllLabels() {
    items.forEach(item => selectedLabelItems.add(item.id));
    renderLabelItems();
}

function deselectAllLabels() {
    selectedLabelItems.clear();
    renderLabelItems();
}

async function printSelectedLabels() {
    if (selectedLabelItems.size === 0) {
        alert('Veuillez sélectionner au moins un article');
        return;
    }

    const selectedItems = items.filter(item => selectedLabelItems.has(item.id));

    // Generate QR codes for all selected items
    const labelData = await Promise.all(selectedItems.map(async (item) => {
        const photo = item.photo || categoryIcons[item.category] || '📦';
        const qrData = JSON.stringify({
            id: item.id,
            name: item.name,
            model: item.model || '',
            serial: item.serial || '',
            category: item.category,
            location: item.location || '',
            url: window.location.href
        });

        // Generate QR code as data URL
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, qrData, {
            width: 150,
            margin: 1
        });

        return {
            item,
            photo,
            qrCodeData: canvas.toDataURL()
        };
    }));

    // Create print window
    const printWindow = window.open('', '', 'height=800,width=1000');

    const labelsHtml = labelData.map(({ item, photo, qrCodeData }) => `
        <div class="label">
            <div class="label-header">
                <div class="label-emoji">${photo}</div>
                <div class="label-title">
                    <h3>${item.name}</h3>
                    ${item.model ? `<p>${item.model}</p>` : ''}
                </div>
            </div>
            <div class="label-qr">
                <img src="${qrCodeData}" alt="QR Code" />
            </div>
            <div class="label-info">
                ${item.serial ? `<div><strong>N° Série:</strong> ${item.serial}</div>` : ''}
                <div><strong>Catégorie:</strong> ${categoryLabels[item.category]}</div>
                ${item.location ? `<div><strong>Emplacement:</strong> ${item.location}</div>` : ''}
            </div>
        </div>
    `).join('');

    printWindow.document.write(`
        <html>
        <head>
            <title>Étiquettes d'inventaire</title>
            <style>
                @page {
                    margin: 10mm;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .label {
                    width: 80mm;
                    height: 50mm;
                    border: 2px solid #333;
                    border-radius: 8px;
                    padding: 5mm;
                    margin-bottom: 5mm;
                    page-break-inside: avoid;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                }
                .label-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                .label-emoji {
                    font-size: 2rem;
                }
                .label-title h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }
                .label-title p {
                    margin: 2px 0 0 0;
                    font-size: 0.85rem;
                    color: #666;
                }
                .label-qr {
                    text-align: center;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .label-qr img {
                    max-width: 100%;
                    height: auto;
                }
                .label-info {
                    font-size: 0.75rem;
                    color: #333;
                    border-top: 1px solid #ddd;
                    padding-top: 5px;
                }
                .label-info div {
                    margin: 2px 0;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .label {
                        margin-bottom: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${labelsHtml}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Export Functions
function exportToCSV() {
    if (items.length === 0) {
        alert('Aucune donnée à exporter');
        return;
    }

    // CSV headers
    const headers = [
        'Nom',
        'Modèle',
        'Catégorie',
        'Quantité',
        'Seuil d\'alerte',
        'N° Série',
        'Emplacement',
        'Fournisseur',
        'Date d\'achat',
        'Prix unitaire (CHF)',
        'Valeur totale (CHF)',
        'Notes',
        'Dernière modification'
    ];

    // Convert items to CSV rows
    const rows = items.map(item => {
        const lastMovement = item.history && item.history.length > 0
            ? new Date(item.history[0].date).toLocaleDateString('fr-CH')
            : 'N/A';

        const totalValue = item.quantity * (item.price || 0);

        return [
            item.name || '',
            item.model || '',
            categoryLabels[item.category] || '',
            item.quantity || 0,
            item.alert_threshold || 5,
            item.serial || '',
            item.location || '',
            item.supplier || '',
            item.purchase_date || '',
            item.price || 0,
            totalValue.toFixed(2),
            (item.notes || '').replace(/"/g, '""'), // Escape quotes
            lastMovement
        ];
    });

    // Build CSV content
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    csvContent += rows.map(row =>
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `inventaire_${date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Export CSV réussi!');
}

// Notification System
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        time: new Date().toISOString(),
        read: false
    };

    notifications.unshift(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '📦'
        });
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotificationCenter() {
    const center = document.getElementById('notification-center');
    const isVisible = center.style.display !== 'none';

    if (isVisible) {
        center.style.display = 'none';
    } else {
        center.style.display = 'block';
        renderNotifications();
    }
}

function renderNotifications() {
    const container = document.getElementById('notification-list');

    if (notifications.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Aucune notification</p>';
        return;
    }

    container.innerHTML = notifications.map(notif => {
        const time = new Date(notif.time);
        const timeAgo = getTimeAgo(time);
        const typeIcon = {
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'info': 'ℹ️'
        }[notif.type] || 'ℹ️';

        return `
            <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead('${notif.id}')">
                <div class="notification-item-title">${typeIcon} ${notif.title}</div>
                <div class="notification-item-message">${notif.message}</div>
                <div class="notification-item-time">${timeAgo}</div>
            </div>
        `;
    }).join('');
}

function markNotificationRead(notifId) {
    const notif = notifications.find(n => n.id == notifId);
    if (notif) {
        notif.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    }
}

function clearAllNotifications() {
    if (confirm('Effacer toutes les notifications ?')) {
        notifications = [];
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        'an': 31536000,
        'mois': 2592000,
        'jour': 86400,
        'heure': 3600,
        'minute': 60
    };

    for (const [name, count] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / count);
        if (interval >= 1) {
            return `Il y a ${interval} ${name}${interval > 1 && name !== 'mois' ? 's' : ''}`;
        }
    }
    return 'À l\'instant';
}

// Toast Notifications
function showToast(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'info': 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function checkLowStockNotifications() {
    // Check for low stock items and send notifications
    const lowStockItems = items.filter(item => {
        const alertThreshold = item.alert_threshold || 5;
        return item.quantity > 0 && item.quantity <= alertThreshold;
    });

    if (lowStockItems.length > 0) {
        lowStockItems.forEach(item => {
            // Check if we've already notified about this item recently
            const recentNotif = notifications.find(n =>
                n.message.includes(item.name) &&
                new Date() - new Date(n.time) < 86400000 // 24 hours
            );

            if (!recentNotif) {
                addNotification(
                    'Stock faible',
                    `${item.name}: ${item.quantity} unité(s) restante(s)`,
                    'warning'
                );
            }
        });
    }
}

// View Management
function setView(view) {
    currentView = view;

    // Update button states
    document.getElementById('view-grid').classList.toggle('active', view === 'grid');
    document.getElementById('view-list').classList.toggle('active', view === 'list');

    // Re-render items
    renderItems();
}

// Theme Management
function initializeTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '☀️ Mode clair';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '🌙 Mode sombre';
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    initializeTheme();
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Ctrl/Cmd + N: New item
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showAddItemModal();
    }

    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }

    // Ctrl/Cmd + L: Toggle view
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setView(currentView === 'grid' ? 'list' : 'grid');
    }

    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }

    // Ctrl/Cmd + W: Show loans (Who has what)
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        showLoansModal();
    }
});
