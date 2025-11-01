// Data Storage
let items = [];
let currentAdjustmentType = 'add';
let currentStatusFilter = 'all';

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

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
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
    document.getElementById('edit-item-location').value = item.location || '';
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

function showAdjustStockModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('adjust-item-id').value = item.id;
    document.getElementById('adjust-stock-form').reset();

    const infoHtml = `
        <div class="adjust-info-title">${item.photo || categoryIcons[item.category]} ${item.name}</div>
        <div class="adjust-info-current">Stock actuel: ${item.quantity} unités</div>
    `;
    document.getElementById('adjust-item-info').innerHTML = infoHtml;

    currentAdjustmentType = 'add';
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

    const adjustmentData = {
        type: currentAdjustmentType,
        quantity: quantity,
        note: note
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

    container.innerHTML = filteredItems.map(item => {
        const alertThreshold = item.alert_threshold || 5;
        const isLowStock = item.quantity > 0 && item.quantity <= alertThreshold;

        const stockClass = item.quantity === 0 ? 'stock-out' :
                          isLowStock ? 'stock-low' : 'stock-available';

        const stockLabel = item.quantity === 0 ? 'Épuisé' :
                          item.quantity === 1 ? '1 unité' :
                          `${item.quantity} unités`;

        const photo = item.photo || categoryIcons[item.category] || '📦';

        return `
            <div class="item-card ${isLowStock ? 'item-low-stock' : ''}">
                ${isLowStock ? '<div class="low-stock-badge">⚠️ Stock faible</div>' : ''}
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
});
