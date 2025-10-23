// Script adapté pour SharePoint REST API
// Remplace script.js pour fonctionner avec SharePoint Lists

// Data Storage
let items = [];
let currentAdjustmentType = 'add';

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

// SharePoint REST API Helper Functions
function getRequestDigest() {
    return new Promise((resolve, reject) => {
        fetch(`${SHAREPOINT_CONFIG.siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose'
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            resolve(data.d.GetContextWebInformation.FormDigestValue);
        })
        .catch(error => {
            console.error('Error getting request digest:', error);
            reject(error);
        });
    });
}

function mapToSharePointItem(item) {
    return {
        '__metadata': { 'type': `SP.Data.${SHAREPOINT_CONFIG.listNameInventaire}ListItem` },
        'ItemID': item.id,
        'Title': item.name,
        'Modele': item.model || null,
        'Quantite': item.quantity || 0,
        'Categorie': CATEGORY_MAPPING[item.category] || item.category,
        'NumeroSerie': item.serial || null,
        'Emplacement': item.location || null,
        'Fournisseur': item.supplier || null,
        'DateAchat': item.purchaseDate || null,
        'PrixUnitaire': item.price || 0,
        'Photo': item.photo || null,
        'Notes': item.notes || null
    };
}

function mapFromSharePointItem(spItem) {
    return {
        id: spItem.ItemID,
        sharePointId: spItem.ID,
        name: spItem.Title,
        model: spItem.Modele,
        quantity: spItem.Quantite,
        category: spItem.Categorie.toLowerCase(),
        serial: spItem.NumeroSerie,
        location: spItem.Emplacement,
        supplier: spItem.Fournisseur,
        purchase_date: spItem.DateAchat,
        price: spItem.PrixUnitaire,
        photo: spItem.Photo,
        notes: spItem.Notes,
        created_at: spItem.Created,
        updated_at: spItem.Modified,
        history: []
    };
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// SharePoint API Functions
async function loadData() {
    try {
        // Load items from SharePoint List
        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameInventaire}')/items?$top=5000`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            }
        );

        if (!response.ok) throw new Error('Failed to load items from SharePoint');

        const data = await response.json();
        items = data.d.results.map(mapFromSharePointItem);

        // Load history for each item
        for (let item of items) {
            await loadItemHistory(item.id);
        }

        renderItems();
        updateStatistics();
    } catch (error) {
        console.error('Error loading data from SharePoint:', error);
        showError('Erreur lors du chargement des données depuis SharePoint: ' + error.message);
    }
}

async function loadItemHistory(itemId) {
    try {
        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameHistorique}')/items?$filter=ItemID eq '${itemId}'&$orderby=DateMouvement desc&$top=100`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                },
                credentials: 'include'
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const item = items.find(i => i.id === itemId);
        if (item) {
            item.history = data.d.results.map(h => ({
                type: h.TypeMouvement.toLowerCase() === 'ajout' ? 'add' : 'remove',
                quantity: h.Quantite,
                previous_quantity: h.QuantiteAvant,
                new_quantity: h.QuantiteApres,
                note: h.NotesMouvement,
                date: h.DateMouvement
            }));
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function saveItem(item) {
    try {
        const digest = await getRequestDigest();
        const spItem = mapToSharePointItem(item);

        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameInventaire}')/items`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': digest
                },
                credentials: 'include',
                body: JSON.stringify(spItem)
            }
        );

        if (!response.ok) throw new Error('Failed to save item to SharePoint');

        // Add initial history entry if quantity > 0
        if (item.quantity > 0) {
            await addHistoryEntry(item.id, 'add', item.quantity, 0, item.quantity, 'Stock initial');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving item:', error);
        showError('Erreur lors de l\'enregistrement: ' + error.message);
        throw error;
    }
}

async function updateItemAPI(itemId, itemData) {
    try {
        const item = items.find(i => i.id === itemId);
        if (!item) throw new Error('Item not found');

        const digest = await getRequestDigest();
        const spItem = mapToSharePointItem({...item, ...itemData, id: itemId});
        delete spItem['__metadata'];

        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameInventaire}')/items(${item.sharePointId})`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': digest,
                    'IF-MATCH': '*',
                    'X-HTTP-Method': 'MERGE'
                },
                credentials: 'include',
                body: JSON.stringify(spItem)
            }
        );

        if (!response.ok) throw new Error('Failed to update item in SharePoint');
        return { message: 'Item updated successfully' };
    } catch (error) {
        console.error('Error updating item:', error);
        showError('Erreur lors de la mise à jour: ' + error.message);
        throw error;
    }
}

async function deleteItemAPI(itemId) {
    try {
        const item = items.find(i => i.id === itemId);
        if (!item) throw new Error('Item not found');

        const digest = await getRequestDigest();

        // Delete history first
        const historyResponse = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameHistorique}')/items?$filter=ItemID eq '${itemId}'`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=verbose' },
                credentials: 'include'
            }
        );

        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            for (const histItem of historyData.d.results) {
                await fetch(
                    `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameHistorique}')/items(${histItem.ID})`,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json;odata=verbose',
                            'X-RequestDigest': digest,
                            'IF-MATCH': '*',
                            'X-HTTP-Method': 'DELETE'
                        },
                        credentials: 'include'
                    }
                );
            }
        }

        // Delete item
        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameInventaire}')/items(${item.sharePointId})`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'X-RequestDigest': digest,
                    'IF-MATCH': '*',
                    'X-HTTP-Method': 'DELETE'
                },
                credentials: 'include'
            }
        );

        if (!response.ok) throw new Error('Failed to delete item from SharePoint');
        return { message: 'Item deleted successfully' };
    } catch (error) {
        console.error('Error deleting item:', error);
        showError('Erreur lors de la suppression: ' + error.message);
        throw error;
    }
}

async function adjustStockAPI(itemId, adjustmentData) {
    try {
        const item = items.find(i => i.id === itemId);
        if (!item) throw new Error('Item not found');

        const previousQuantity = item.quantity;
        let newQuantity;

        if (adjustmentData.type === 'add') {
            newQuantity = previousQuantity + adjustmentData.quantity;
        } else {
            if (previousQuantity < adjustmentData.quantity) {
                throw new Error('Cannot remove more units than available in stock');
            }
            newQuantity = previousQuantity - adjustmentData.quantity;
        }

        // Update quantity in SharePoint
        const digest = await getRequestDigest();
        const response = await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameInventaire}')/items(${item.sharePointId})`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': digest,
                    'IF-MATCH': '*',
                    'X-HTTP-Method': 'MERGE'
                },
                credentials: 'include',
                body: JSON.stringify({ 'Quantite': newQuantity })
            }
        );

        if (!response.ok) throw new Error('Failed to adjust stock in SharePoint');

        // Add history entry
        await addHistoryEntry(
            itemId,
            adjustmentData.type,
            adjustmentData.quantity,
            previousQuantity,
            newQuantity,
            adjustmentData.note
        );

        return {
            message: 'Stock adjusted successfully',
            previousQuantity,
            newQuantity
        };
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showError(error.message);
        throw error;
    }
}

async function addHistoryEntry(itemId, type, quantity, previousQty, newQty, note) {
    try {
        const digest = await getRequestDigest();

        const historyItem = {
            '__metadata': { 'type': `SP.Data.${SHAREPOINT_CONFIG.listNameHistorique}ListItem` },
            'Title': `${type === 'add' ? 'Ajout' : 'Retrait'} de ${quantity} unité(s)`,
            'ItemID': itemId,
            'TypeMouvement': type === 'add' ? 'Ajout' : 'Retrait',
            'Quantite': quantity,
            'QuantiteAvant': previousQty,
            'QuantiteApres': newQty,
            'NotesMouvement': note || null,
            'DateMouvement': new Date().toISOString()
        };

        await fetch(
            `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${SHAREPOINT_CONFIG.listNameHistorique}')/items`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': digest
                },
                credentials: 'include',
                body: JSON.stringify(historyItem)
            }
        );
    } catch (error) {
        console.error('Error adding history entry:', error);
    }
}

// Modal Functions (unchanged from original)
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
        notes: document.getElementById('item-notes').value
    };

    try {
        await saveItem(newItem);
        await loadData();
        closeAddItemModal();
        showSuccess('Article ajouté avec succès dans SharePoint');
    } catch (error) {
        // Error already handled
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
        notes: document.getElementById('edit-item-notes').value
    };

    try {
        await updateItemAPI(itemId, itemData);
        await loadData();
        closeEditItemModal();
        showSuccess('Article modifié avec succès dans SharePoint');
    } catch (error) {
        // Error already handled
    }
}

async function deleteItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" de SharePoint ?`)) {
        try {
            await deleteItemAPI(itemId);
            await loadData();
            showSuccess('Article supprimé avec succès de SharePoint');
        } catch (error) {
            // Error already handled
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
        showSuccess('Stock ajusté avec succès dans SharePoint');
    } catch (error) {
        // Error already handled
    }
}

// Rendering Functions (unchanged from original - see script.js lines 336-519)
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

        return matchesSearch && matchesCategory;
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
        const stockClass = item.quantity === 0 ? 'stock-out' :
                          item.quantity <= 5 ? 'stock-low' : 'stock-available';

        const stockLabel = item.quantity === 0 ? 'Épuisé' :
                          item.quantity === 1 ? '1 unité' :
                          `${item.quantity} unités`;

        const photo = item.photo || categoryIcons[item.category] || '📦';

        return `
            <div class="item-card">
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
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

    document.getElementById('stat-items').textContent = totalItems;
    document.getElementById('stat-units').textContent = totalUnits;
    document.getElementById('stat-in-stock').textContent = inStock;
    document.getElementById('stat-out-stock').textContent = outOfStock;
    document.getElementById('stat-value').textContent = formatPrice(totalValue);
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
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});
