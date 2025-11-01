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

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeTheme();
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

    document.getElementById('edit-item-supplier').value = item.supplier || '';
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

function showHistoryModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

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

                <div class="quick-actions">
                    <button class="btn btn-success btn-quick" onclick="showAdjustStockModal('${item.id}', 'add', 1)" title="Ajouter 1 unité">
                        ➕
                    </button>
                    <button class="btn btn-danger btn-quick" onclick="showAdjustStockModal('${item.id}', 'remove', 1)" title="Retirer 1 unité">
                        ➖
                    </button>
                </div>

                <div class="item-actions">
                    <button class="btn btn-success btn-small" onclick="showAdjustStockModal('${item.id}')">
                        📊 Ajuster
                    </button>
                    <button class="btn btn-info btn-small" onclick="showHistoryModal('${item.id}')">
                        📜 Historique
                    </button>
                    <button class="btn btn-warning btn-small" onclick="showEditItemModal('${item.id}')">
                        ✏️ Modifier
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteItem('${item.id}')">
                        🗑️ Supprimer
                    </button>
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
    // Simple alert for now - could be replaced with a toast notification
    console.log('Success:', message);
}

function showError(message) {
    alert(message);
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
