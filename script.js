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

// ===== Password Security Functions =====
function hashPassword(password) {
    // Use SHA256 to hash the password
    return CryptoJS.SHA256(password).toString();
}

function verifyPassword(inputPassword, storedHash) {
    // Hash the input and compare
    return hashPassword(inputPassword) === storedHash;
}

// Migrate existing plain text passwords to hashed passwords
function migratePasswordsToHash() {
    let migrated = false;
    users.forEach(user => {
        // Check if password is not already hashed (hashed passwords are 64 chars long)
        if (user.password && user.password.length !== 64) {
            console.log(`Migrating password for user: ${user.username}`);
            user.password = hashPassword(user.password);
            migrated = true;
        }
    });

    if (migrated) {
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Password migration completed');
    }
}

// Run migration on startup
migratePasswordsToHash();

// ===== Session Timeout Management =====
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

function updateLastActivity() {
    localStorage.setItem('lastActivity', Date.now().toString());
}

function checkSessionTimeout() {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) {
        updateLastActivity();
        return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);

    if (timeSinceLastActivity > SESSION_TIMEOUT) {
        // Session expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastActivity');
        alert('⏱️ Votre session a expiré après 2 heures d\'inactivité. Veuillez vous reconnecter.');
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }
}

// Initialize activity tracking
updateLastActivity();

// Check session timeout every minute
setInterval(checkSessionTimeout, 60000);

// Update activity on user interactions
document.addEventListener('click', updateLastActivity);
document.addEventListener('keydown', updateLastActivity);
document.addEventListener('scroll', updateLastActivity);

// ===== Audit Trail System =====
let auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');

function logAuditEvent(action, details, targetType = 'item') {
    const auditEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.username : 'Unknown',
        userId: currentUser ? currentUser.id : null,
        action: action, // 'create', 'update', 'delete', 'login', 'logout', 'stock_adjustment', etc.
        targetType: targetType, // 'item', 'user', 'supplier', 'loan', etc.
        details: details,
        ipAddress: null // Could be added with backend
    };

    auditLogs.unshift(auditEntry); // Add to beginning

    // Keep only last 1000 entries to prevent localStorage overflow
    if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(0, 1000);
    }

    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    console.log('Audit:', auditEntry);
}

function getAuditLogs(filter = {}) {
    let filtered = [...auditLogs];

    if (filter.action) {
        filtered = filtered.filter(log => log.action === filter.action);
    }

    if (filter.targetType) {
        filtered = filtered.filter(log => log.targetType === filter.targetType);
    }

    if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
    }

    if (filter.startDate) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
        filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
    }

    return filtered;
}

function clearOldAuditLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= cutoffDate);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

// Check authentication before loading app
const isAuthenticated = localStorage.getItem('isAuthenticated');
if (!isAuthenticated || isAuthenticated !== 'true' || !currentUser) {
    // Not authenticated, redirect to login
    window.location.href = 'login.html';
    throw new Error('Not authenticated'); // Stop script execution
}

// Add logout function
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        // Log audit event before logout
        logAuditEvent('logout', {
            username: currentUser.username
        }, 'auth');

        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
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

    const importBtn = document.getElementById('import-csv-btn');
    if (importBtn) importBtn.style.display = hasPermission('canAddItems') ? 'inline-block' : 'none';

    const exportBtn = document.querySelector('button[onclick="exportToCSV()"]');
    if (exportBtn) exportBtn.style.display = hasPermission('canExport') ? 'inline-block' : 'none';

    const labelBtn = document.querySelector('button[onclick="showLabelPrintModal()"]');
    if (labelBtn) labelBtn.style.display = hasPermission('canPrintLabels') ? 'inline-block' : 'none';

    const suppliersBtn = document.querySelector('button[onclick="showSuppliersModal()"]');
    if (suppliersBtn) suppliersBtn.style.display = hasPermission('canManageSuppliers') ? 'inline-block' : 'none';

    const userManagementBtn = document.getElementById('user-management-btn');
    if (userManagementBtn) userManagementBtn.style.display = hasPermission('canManageUsers') ? 'inline-block' : 'none';

    const auditLogBtn = document.getElementById('audit-log-btn');
    if (auditLogBtn) auditLogBtn.style.display = hasPermission('canManageUsers') ? 'inline-block' : 'none';

    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) backupBtn.style.display = hasPermission('canManageUsers') ? 'inline-block' : 'none';
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
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Statut</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
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
                            ${currentUser.id === user.id ? '<span style="color: #28a745;">✓ Connecté</span>' : ''}
                        </td>
                        <td style="padding: 12px;">
                            <button class="btn btn-small btn-warning" onclick="editUser('${user.id}')" title="Modifier">✏️</button>
                            ${currentUser.id !== user.id ? `
                                <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}')" title="Supprimer">🗑️</button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== Password Strength Validation =====
function checkPasswordStrength() {
    const passwordInput = document.getElementById('user-password');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const strengthContainer = document.getElementById('password-strength');
    const password = passwordInput.value;

    if (!password) {
        strengthContainer.style.display = 'none';
        return;
    }

    strengthContainer.style.display = 'block';

    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    // Calculate strength
    if (checks.length) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;

    // Update visual indicator
    strengthBar.style.width = strength + '%';

    if (strength <= 40) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '❌ Faible - Ne respecte pas les exigences';
        strengthText.style.color = '#dc3545';
    } else if (strength <= 60) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '⚠️ Moyen - Ajoutez des caractères spéciaux';
        strengthText.style.color = '#ffc107';
    } else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '✅ Fort - Excellent mot de passe';
        strengthText.style.color = '#28a745';
    }
}

function validatePasswordStrength(password) {
    // Minimum requirements
    if (password.length < 8) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    return { valid: true };
}

function showAddUserModal() {
    document.getElementById('user-form-title').textContent = 'Ajouter un Utilisateur';
    document.getElementById('user-form').reset();
    document.getElementById('user-edit-id').value = '';

    // Password required for new users
    const passwordInput = document.getElementById('user-password');
    passwordInput.required = true;

    // Reset password strength indicator
    document.getElementById('password-strength').style.display = 'none';
    document.getElementById('password-strength-bar').style.width = '0%';

    document.getElementById('user-form-modal').classList.add('show');
}

function closeUserFormModal() {
    document.getElementById('user-form-modal').classList.remove('show');
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-form-title').textContent = 'Modifier l\'Utilisateur';
    document.getElementById('user-edit-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;

    // Password not required for edit (only if user wants to change it)
    const passwordInput = document.getElementById('user-password');
    passwordInput.required = false;
    passwordInput.value = '';
    passwordInput.placeholder = 'Laisser vide pour ne pas changer';

    // Reset password strength indicator
    document.getElementById('password-strength').style.display = 'none';
    document.getElementById('password-strength-bar').style.width = '0%';

    document.getElementById('user-form-modal').classList.add('show');
}

function saveUser(event) {
    event.preventDefault();

    const userId = document.getElementById('user-edit-id').value;
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    // Check if username already exists (except for current user when editing)
    const existingUser = users.find(u => u.username === username && u.id !== userId);
    if (existingUser) {
        showToast('Erreur', 'Ce nom d\'utilisateur existe déjà', 'error');
        return;
    }

    // Validate password strength if provided
    if (password) {
        const validation = validatePasswordStrength(password);
        if (!validation.valid) {
            showToast('Erreur', validation.message, 'error');
            return;
        }
    }

    if (userId) {
        // Update existing user
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].username = username;
            users[index].email = email;
            users[index].role = role;

            // Only update password if provided
            if (password) {
                users[index].password = hashPassword(password);
            }

            // If editing current user, update currentUser object
            if (currentUser.id === userId) {
                currentUser = users[index];
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUserInterface();
            }

            // Log audit event
            logAuditEvent('update', {
                targetUsername: username,
                targetUserId: userId,
                role: role,
                passwordChanged: !!password
            }, 'user');

            showToast('Succès', 'Utilisateur modifié avec succès', 'success');
        }
    } else {
        // Add new user
        if (!password) {
            showToast('Erreur', 'Le mot de passe est requis pour un nouvel utilisateur', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: hashPassword(password),
            role: role,
            created: new Date().toISOString()
        };

        users.push(newUser);

        // Log audit event
        logAuditEvent('create', {
            targetUsername: username,
            targetUserId: newUser.id,
            role: role
        }, 'user');

        showToast('Succès', 'Utilisateur ajouté avec succès', 'success');
    }

    localStorage.setItem('users', JSON.stringify(users));
    closeUserFormModal();
    renderUsersTable();
}

function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Prevent deleting yourself
    if (currentUser.id === userId) {
        showToast('Erreur', 'Vous ne pouvez pas supprimer votre propre compte', 'error');
        return;
    }

    // Prevent deleting the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (user.role === 'admin' && adminCount <= 1) {
        showToast('Erreur', 'Impossible de supprimer le dernier administrateur', 'error');
        return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
        // Log audit event before deletion
        logAuditEvent('delete', {
            targetUsername: user.username,
            targetUserId: userId,
            role: user.role
        }, 'user');

        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        renderUsersTable();
        showToast('Succès', 'Utilisateur supprimé avec succès', 'success');
    }
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

// ===== Audit Log Viewer Functions =====
function showAuditLogModal() {
    renderAuditLogs();
    document.getElementById('audit-log-modal').classList.add('show');
}

function closeAuditLogModal() {
    document.getElementById('audit-log-modal').classList.remove('show');
}

function renderAuditLogs(filters = {}) {
    const container = document.getElementById('audit-logs-container');
    const logs = getAuditLogs(filters);

    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun journal d\'audit trouvé</p>';
        return;
    }

    const actionIcons = {
        'login': '🔓',
        'logout': '🔒',
        'password_change': '🔑',
        'create': '➕',
        'update': '✏️',
        'delete': '🗑️',
        'stock_adjustment': '📊',
        'backup_export': '📥',
        'backup_restore_start': '📤'
    };

    const typeLabels = {
        'item': 'Article',
        'user': 'Utilisateur',
        'supplier': 'Fournisseur',
        'auth': 'Authentification',
        'loan': 'Prêt',
        'system': 'Système'
    };

    const actionLabels = {
        'login': 'Connexion',
        'logout': 'Déconnexion',
        'password_change': 'Changement mot de passe',
        'create': 'Création',
        'update': 'Modification',
        'delete': 'Suppression',
        'stock_adjustment': 'Ajustement stock',
        'backup_export': 'Export sauvegarde',
        'backup_restore_start': 'Restauration sauvegarde'
    };

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';

    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleString('fr-FR');
        const icon = actionIcons[log.action] || '📝';
        const typeLabel = typeLabels[log.targetType] || log.targetType;
        const actionLabel = actionLabels[log.action] || log.action;

        html += `
            <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">${icon}</span>
                        <strong>${actionLabel}</strong>
                        <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${typeLabel}</span>
                    </div>
                    <span style="color: #666; font-size: 0.85rem;">${formattedDate}</span>
                </div>
                <div style="color: #555; font-size: 0.9rem; margin-bottom: 6px;">
                    <strong>Utilisateur:</strong> ${log.user}
                </div>
                <div style="color: #777; font-size: 0.85rem; font-family: monospace; background: #f9f9f9; padding: 6px; border-radius: 4px;">
                    ${JSON.stringify(log.details, null, 2).replace(/[{}",]/g, '').trim()}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function filterAuditLogs() {
    const action = document.getElementById('audit-filter-action').value;
    const targetType = document.getElementById('audit-filter-type').value;

    const filters = {};
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;

    renderAuditLogs(filters);
}

function clearAuditFilters() {
    document.getElementById('audit-filter-action').value = '';
    document.getElementById('audit-filter-type').value = '';
    renderAuditLogs();
}

function exportAuditLogsToCSV() {
    const action = document.getElementById('audit-filter-action').value;
    const targetType = document.getElementById('audit-filter-type').value;

    const filters = {};
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;

    const logs = getAuditLogs(filters);

    if (logs.length === 0) {
        showToast('Info', 'Aucun log à exporter', 'info');
        return;
    }

    // Create CSV header
    let csv = 'ID,Date/Heure,Utilisateur,Action,Type,Détails\n';

    // Add rows
    logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleString('fr-FR');
        const details = JSON.stringify(log.details).replace(/"/g, '""'); // Escape quotes

        csv += `"${log.id}","${date}","${log.user}","${log.action}","${log.targetType}","${details}"\n`;
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Succès', `${logs.length} entrées exportées en CSV`, 'success');
}

// ===== User Profile Functions =====
function showProfileModal() {
    const roleLabels = {
        'admin': '👑 Administrateur',
        'manager': '👨‍💼 Gestionnaire',
        'viewer': '👁️ Lecteur'
    };

    document.getElementById('profile-username').textContent = currentUser.username;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-role').textContent = roleLabels[currentUser.role] || currentUser.role;

    // Reset form
    document.getElementById('change-password-form').reset();
    document.getElementById('new-password-strength').style.display = 'none';
    document.getElementById('new-password-strength-bar').style.width = '0%';

    document.getElementById('profile-modal').classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('show');
}

function checkNewPasswordStrength() {
    const passwordInput = document.getElementById('new-password');
    const strengthBar = document.getElementById('new-password-strength-bar');
    const strengthText = document.getElementById('new-password-strength-text');
    const strengthContainer = document.getElementById('new-password-strength');
    const password = passwordInput.value;

    if (!password) {
        strengthContainer.style.display = 'none';
        return;
    }

    strengthContainer.style.display = 'block';

    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    // Calculate strength
    if (checks.length) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;

    // Update visual indicator
    strengthBar.style.width = strength + '%';

    if (strength <= 40) {
        strengthBar.style.background = '#dc3545';
        strengthText.textContent = '❌ Faible - Ne respecte pas les exigences';
        strengthText.style.color = '#dc3545';
    } else if (strength <= 60) {
        strengthBar.style.background = '#ffc107';
        strengthText.textContent = '⚠️ Moyen - Ajoutez des caractères spéciaux';
        strengthText.style.color = '#ffc107';
    } else {
        strengthBar.style.background = '#28a745';
        strengthText.textContent = '✅ Fort - Excellent mot de passe';
        strengthText.style.color = '#28a745';
    }
}

function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Verify current password
    if (!verifyPassword(currentPassword, currentUser.password)) {
        showToast('Erreur', 'Le mot de passe actuel est incorrect', 'error');
        return;
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
        showToast('Erreur', 'Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        showToast('Erreur', validation.message, 'error');
        return;
    }

    // Check if new password is different from current
    if (verifyPassword(newPassword, currentUser.password)) {
        showToast('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien', 'error');
        return;
    }

    // Update password
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = hashPassword(newPassword);
        localStorage.setItem('users', JSON.stringify(users));

        // Update current user object
        currentUser = users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Log audit event
        logAuditEvent('password_change', {
            username: currentUser.username
        }, 'auth');

        showToast('Succès', 'Mot de passe modifié avec succès', 'success');
        closeProfileModal();
    }
}

// ===== Backup and Restore Functions =====
function showBackupModal() {
    document.getElementById('backup-modal').classList.add('show');
}

function closeBackupModal() {
    document.getElementById('backup-modal').classList.remove('show');
}

function exportBackup() {
    // Collect all data from localStorage
    const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.username,
        data: {
            users: JSON.parse(localStorage.getItem('users') || '[]'),
            items: JSON.parse(localStorage.getItem('items') || '[]'),
            suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]'),
            locations: JSON.parse(localStorage.getItem('locations') || '[]'),
            auditLogs: JSON.parse(localStorage.getItem('auditLogs') || '[]'),
            loans: JSON.parse(localStorage.getItem('loans') || '[]'),
            notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
            theme: localStorage.getItem('theme') || 'light'
        }
    };

    // Create JSON blob
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_backup_${timestamp}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log audit event
    logAuditEvent('backup_export', {
        itemCount: backupData.data.items.length,
        userCount: backupData.data.users.length,
        supplierCount: backupData.data.suppliers.length,
        auditLogCount: backupData.data.auditLogs.length
    }, 'system');

    showToast('Succès', 'Sauvegarde exportée avec succès', 'success');
}

function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Verify it's a JSON file
    if (!file.name.endsWith('.json')) {
        showToast('Erreur', 'Le fichier doit être au format JSON', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // Validate backup structure
            if (!backupData.version || !backupData.data) {
                throw new Error('Format de sauvegarde invalide');
            }

            // Show confirmation dialog
            const itemCount = backupData.data.items?.length || 0;
            const userCount = backupData.data.users?.length || 0;
            const supplierCount = backupData.data.suppliers?.length || 0;
            const exportDate = new Date(backupData.exportDate).toLocaleString('fr-FR');

            const confirmed = confirm(
                `⚠️ CONFIRMATION DE RESTAURATION\n\n` +
                `Cette sauvegarde contient:\n` +
                `- ${itemCount} articles\n` +
                `- ${userCount} utilisateurs\n` +
                `- ${supplierCount} fournisseurs\n` +
                `- Exportée le: ${exportDate}\n` +
                `- Exportée par: ${backupData.exportedBy || 'Inconnu'}\n\n` +
                `ATTENTION: Cette action remplacera TOUTES vos données actuelles.\n` +
                `Cette opération est IRRÉVERSIBLE.\n\n` +
                `Voulez-vous vraiment continuer ?`
            );

            if (!confirmed) {
                showToast('Info', 'Restauration annulée', 'info');
                return;
            }

            // Restore data
            restoreBackup(backupData);

        } catch (error) {
            console.error('Error reading backup file:', error);
            showToast('Erreur', 'Impossible de lire le fichier de sauvegarde: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

function restoreBackup(backupData) {
    try {
        // Log audit event BEFORE restoration
        logAuditEvent('backup_restore_start', {
            exportDate: backupData.exportDate,
            exportedBy: backupData.exportedBy,
            itemCount: backupData.data.items?.length || 0,
            userCount: backupData.data.users?.length || 0
        }, 'system');

        // Restore all data
        if (backupData.data.users) localStorage.setItem('users', JSON.stringify(backupData.data.users));
        if (backupData.data.items) localStorage.setItem('items', JSON.stringify(backupData.data.items));
        if (backupData.data.suppliers) localStorage.setItem('suppliers', JSON.stringify(backupData.data.suppliers));
        if (backupData.data.locations) localStorage.setItem('locations', JSON.stringify(backupData.data.locations));
        if (backupData.data.auditLogs) localStorage.setItem('auditLogs', JSON.stringify(backupData.data.auditLogs));
        if (backupData.data.loans) localStorage.setItem('loans', JSON.stringify(backupData.data.loans));
        if (backupData.data.notifications) localStorage.setItem('notifications', JSON.stringify(backupData.data.notifications));
        if (backupData.data.theme) localStorage.setItem('theme', backupData.data.theme);

        showToast('Succès', 'Sauvegarde restaurée avec succès. Rechargement de la page...', 'success');

        // Reload page after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error restoring backup:', error);
        showToast('Erreur', 'Erreur lors de la restauration: ' + error.message, 'error');
    }
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
        const result = await response.json();

        // Log audit event
        logAuditEvent('create', {
            itemName: item.name,
            itemId: result.id,
            category: item.category,
            quantity: item.quantity
        }, 'item');

        return result;
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
        const result = await response.json();

        // Log audit event
        logAuditEvent('update', {
            itemName: itemData.name,
            itemId: itemId,
            changes: itemData
        }, 'item');

        return result;
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
        const result = await response.json();

        // Log audit event
        logAuditEvent('delete', {
            itemId: itemId
        }, 'item');

        return result;
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
        const result = await response.json();

        // Log audit event
        logAuditEvent('stock_adjustment', {
            itemId: itemId,
            adjustment: adjustmentData.adjustment,
            reason: adjustmentData.reason,
            newQuantity: result.quantity
        }, 'item');

        return result;
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

    // Get audit logs for this item
    const itemAuditLogs = auditLogs.filter(log =>
        log.targetType === 'item' &&
        log.details &&
        (log.details.itemId === itemId || log.details.itemName === item.name)
    );

    let historyHtml = `<div class="history-list">`;

    // Section 1: Modifications de l'article (from audit logs)
    if (itemAuditLogs.length > 0) {
        historyHtml += `<h3 style="margin: 20px 0 15px 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px;">✏️ Modifications de l'article</h3>`;

        const sortedAuditLogs = [...itemAuditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedAuditLogs.forEach(log => {
            let icon = '📝';
            let actionLabel = log.action;
            let details = '';

            if (log.action === 'create') {
                icon = '➕';
                actionLabel = 'Création';
                details = `Catégorie: ${log.details.category || 'N/A'}, Quantité initiale: ${log.details.quantity || 0}`;
            } else if (log.action === 'update') {
                icon = '✏️';
                actionLabel = 'Modification';
                details = 'Article mis à jour';
            } else if (log.action === 'delete') {
                icon = '🗑️';
                actionLabel = 'Suppression';
                details = 'Article supprimé';
            } else if (log.action === 'stock_adjustment') {
                icon = '📊';
                actionLabel = 'Ajustement stock';
                details = `Ajustement: ${log.details.adjustment || 0}, Nouvelle quantité: ${log.details.newQuantity || 0}`;
            }

            const date = new Date(log.timestamp).toLocaleString('fr-FR');

            historyHtml += `
                <div class="history-item">
                    <div class="history-icon">${icon}</div>
                    <div class="history-content">
                        <div class="history-type">${actionLabel}</div>
                        <div class="history-details">${details}</div>
                        <div class="history-person">👤 Par: <strong>${log.user}</strong></div>
                        <div class="history-date">${date}</div>
                    </div>
                </div>
            `;
        });
    }

    // Section 2: Mouvements de stock
    if (item.history && item.history.length > 0) {
        historyHtml += `<h3 style="margin: 20px 0 15px 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px;">📦 Mouvements de stock</h3>`;

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

    if (itemAuditLogs.length === 0 && (!item.history || item.history.length === 0)) {
        historyHtml += `<div class="empty-state"><p>Aucun historique disponible pour cet article.</p></div>`;
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

function duplicateItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Open add modal
    showAddItemModal();

    // Pre-fill all fields with source item data
    document.getElementById('item-name').value = item.name + ' (Copie)';
    document.getElementById('item-model').value = item.model || '';
    document.getElementById('item-quantity').value = 0; // Start with 0 quantity for duplicate
    document.getElementById('item-alert-threshold').value = item.alert_threshold || 5;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-serial').value = ''; // Clear serial number for duplicate

    // Handle location
    const locationSelect = document.getElementById('item-location-select');
    const locationInput = document.getElementById('item-location');
    const locationOptions = Array.from(locationSelect.options).map(opt => opt.value);

    if (item.location && locationOptions.includes(item.location)) {
        locationSelect.value = item.location;
        locationInput.style.display = 'none';
        locationInput.value = '';
    } else if (item.location) {
        locationSelect.value = '__other__';
        locationInput.style.display = 'block';
        locationInput.value = item.location;
    }

    // Handle supplier
    const supplierSelect = document.getElementById('item-supplier-select');
    const supplierInput = document.getElementById('item-supplier');
    const supplierOptions = Array.from(supplierSelect.options).map(opt => opt.value);

    if (item.supplier && supplierOptions.includes(item.supplier)) {
        supplierSelect.value = item.supplier;
        supplierInput.style.display = 'none';
        supplierInput.value = '';
    } else if (item.supplier) {
        supplierSelect.value = '__other__';
        supplierInput.style.display = 'block';
        supplierInput.value = item.supplier;
    }

    document.getElementById('item-purchase-date').value = item.purchase_date || '';
    document.getElementById('item-price').value = item.price || '';
    document.getElementById('item-photo').value = item.photo || '';
    document.getElementById('item-notes').value = item.notes || '';

    showToast('Info', 'Article dupliqué. Modifiez les données et sauvegardez.', 'info');
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

    let filteredItems;

    // Use advanced search if active
    if (advancedSearchActive) {
        filteredItems = filterItemsByAdvancedCriteria(items, advancedSearchCriteria);
    } else {
        filteredItems = items.filter(item => {
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
    }

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
                    ${hasPermission('canAddItems') ? `
                        <button class="btn btn-info btn-small" onclick="duplicateItem('${item.id}')" title="Créer une copie de cet article">
                            📋 Dupliquer
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

// Print Inventory Report
function printInventoryReport() {
    const date = new Date().toLocaleDateString('fr-FR');
    const time = new Date().toLocaleTimeString('fr-FR');

    // Calculate statistics
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
    const inStock = items.filter(item => item.quantity > 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= (item.alert_threshold || 5)).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;

    // Group by category
    const categoryGroups = {};
    items.forEach(item => {
        if (!categoryGroups[item.category]) {
            categoryGroups[item.category] = [];
        }
        categoryGroups[item.category].push(item);
    });

    // Generate HTML for print
    let reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Rapport d'Inventaire - ${date}</title>
            <style>
                @media print {
                    @page { margin: 1cm; }
                    body { margin: 0; }
                    .no-print { display: none !important; }
                }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.4;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #667eea;
                }
                .header h1 {
                    margin: 0;
                    color: #667eea;
                    font-size: 24pt;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                .summary-card .label {
                    font-size: 10pt;
                    color: #666;
                    margin-bottom: 5px;
                }
                .summary-card .value {
                    font-size: 18pt;
                    font-weight: bold;
                    color: #333;
                }
                .category-section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .category-header {
                    background: #667eea;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 14pt;
                    margin-bottom: 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                table th {
                    background: #f8f9fa;
                    padding: 8px;
                    text-align: left;
                    border-bottom: 2px solid #ddd;
                    font-weight: bold;
                }
                table td {
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                }
                table tr:hover {
                    background: #f8f9fa;
                }
                .stock-low {
                    color: #ff9800;
                    font-weight: bold;
                }
                .stock-out {
                    color: #f44336;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 10pt;
                }
                .no-print {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14pt;">
                    🖨️ Imprimer / Sauvegarder en PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14pt; margin-left: 10px;">
                    ✖️ Fermer
                </button>
            </div>

            <div class="header">
                <h1>📦 Rapport d'Inventaire IT</h1>
                <p>Généré le ${date} à ${time}</p>
                <p>Utilisateur: ${currentUser ? currentUser.username : 'N/A'}</p>
            </div>

            <div class="summary">
                <div class="summary-card">
                    <div class="label">Total Articles</div>
                    <div class="value">${items.length}</div>
                </div>
                <div class="summary-card">
                    <div class="label">En Stock</div>
                    <div class="value">${inStock}</div>
                </div>
                <div class="summary-card">
                    <div class="label">Stock Faible</div>
                    <div class="value" style="color: #ff9800;">${lowStock}</div>
                </div>
                <div class="summary-card">
                    <div class="label">Épuisés</div>
                    <div class="value" style="color: #f44336;">${outOfStock}</div>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                <strong>💰 Valeur Totale de l'Inventaire:</strong> <span style="font-size: 18pt; font-weight: bold; color: #667eea;">${totalValue.toFixed(2)} CHF</span>
            </div>
    `;

    // Add items by category
    Object.keys(categoryGroups).sort().forEach(category => {
        const categoryItems = categoryGroups[category];
        const categoryLabel = categoryLabels[category] || category;

        reportHTML += `
            <div class="category-section">
                <div class="category-header">${categoryIcons[category] || ''} ${categoryLabel} (${categoryItems.length} articles)</div>
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Modèle</th>
                            <th>Quantité</th>
                            <th>Emplacement</th>
                            <th>Prix Unit.</th>
                            <th>Valeur Tot.</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        categoryItems.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
            const stockClass = item.quantity === 0 ? 'stock-out' :
                              (item.quantity <= (item.alert_threshold || 5) ? 'stock-low' : '');
            const totalValue = item.quantity * (item.price || 0);

            reportHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.model || '-'}</td>
                    <td class="${stockClass}">${item.quantity}</td>
                    <td>${item.location || '-'}</td>
                    <td>${(item.price || 0).toFixed(2)} CHF</td>
                    <td>${totalValue.toFixed(2)} CHF</td>
                </tr>
            `;
        });

        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    });

    reportHTML += `
            <div class="footer">
                <p>Rapport généré par le système de Gestion de Stock IT</p>
                <p>Ce document est confidentiel et destiné à un usage interne uniquement</p>
            </div>
        </body>
        </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
}

// CSV Import Functions
function showImportCSVModal() {
    if (!hasPermission('canAddItems')) {
        showError('Vous n\'avez pas la permission d\'importer des articles');
        return;
    }

    // Reset file input and results
    document.getElementById('csv-file-input').value = '';
    document.getElementById('import-results').style.display = 'none';
    document.getElementById('import-results').innerHTML = '';

    document.getElementById('csv-import-modal').classList.add('show');
}

function closeImportCSVModal() {
    document.getElementById('csv-import-modal').classList.remove('show');
}

function downloadCSVTemplate() {
    // Create template with headers and example rows
    const headers = [
        'name',
        'model',
        'quantity',
        'alert_threshold',
        'category',
        'serial',
        'location',
        'supplier',
        'purchase_date',
        'price',
        'photo',
        'notes'
    ];

    const exampleRow1 = [
        'Clavier sans fil Logitech',
        'K380 Multi-Device Bluetooth',
        '15',
        '5',
        'peripheriques',
        'K380-2024-001',
        'Bureau IT - Armoire A',
        'Logitech',
        '2024-01-15',
        '49.90',
        '⌨️',
        'Compatible Mac, Windows, iOS, Android'
    ];

    const exampleRow2 = [
        'Écran Dell UltraSharp',
        '27" 4K U2720Q',
        '8',
        '3',
        'ecrans',
        'DELL-U2720Q-001',
        'Stock sécurisé',
        'Dell',
        '2024-02-10',
        '549.00',
        '📺',
        'Résolution 3840x2160, USB-C'
    ];

    // Build CSV content
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += headers.join(',') + '\n';
    csvContent += exampleRow1.map(cell => `"${cell}"`).join(',') + '\n';
    csvContent += exampleRow2.map(cell => `"${cell}"`).join(',') + '\n';

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_articles.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Modèle CSV téléchargé!');
}

function parseCSV(text) {
    // Simple CSV parser that handles quoted fields and both comma and semicolon delimiters
    const lines = text.split('\n');
    const result = [];

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    for (let line of lines) {
        if (!line.trim()) continue;

        const row = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else if (char !== '\r') {
                current += char;
            }
        }
        row.push(current.trim());
        result.push(row);
    }

    return result;
}

function validateCSVRow(row, headers, rowIndex) {
    const errors = [];
    const item = {};

    // Map CSV columns to item object
    headers.forEach((header, index) => {
        const value = row[index] || '';
        item[header.toLowerCase().trim()] = value;
    });

    // Validate required fields
    if (!item.name || item.name.trim() === '') {
        errors.push(`Ligne ${rowIndex}: Le nom est obligatoire`);
    }

    if (!item.quantity || isNaN(parseInt(item.quantity))) {
        errors.push(`Ligne ${rowIndex}: La quantité doit être un nombre valide`);
    }

    if (!item.category || item.category.trim() === '') {
        errors.push(`Ligne ${rowIndex}: La catégorie est obligatoire`);
    } else {
        // Validate category value
        const validCategories = [
            'informatique', 'peripheriques', 'ecrans', 'connectique',
            'alimentation', 'docking', 'audio', 'reseau', 'stockage', 'mobile'
        ];
        if (!validCategories.includes(item.category.toLowerCase().trim())) {
            errors.push(`Ligne ${rowIndex}: Catégorie invalide "${item.category}". Valeurs acceptées: ${validCategories.join(', ')}`);
        }
    }

    // Validate numeric fields
    if (item.alert_threshold && isNaN(parseInt(item.alert_threshold))) {
        errors.push(`Ligne ${rowIndex}: Le seuil d'alerte doit être un nombre`);
    }

    if (item.price && isNaN(parseFloat(item.price))) {
        errors.push(`Ligne ${rowIndex}: Le prix doit être un nombre`);
    }

    // Validate date format
    if (item.purchase_date && item.purchase_date.trim() !== '') {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(item.purchase_date.trim())) {
            errors.push(`Ligne ${rowIndex}: La date d'achat doit être au format YYYY-MM-DD`);
        }
    }

    return { item, errors };
}

async function processCSVImport() {
    const fileInput = document.getElementById('csv-file-input');
    const resultsDiv = document.getElementById('import-results');

    if (!fileInput.files || fileInput.files.length === 0) {
        showError('Veuillez sélectionner un fichier CSV');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const rows = parseCSV(text);

            if (rows.length < 2) {
                showError('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
                return;
            }

            const headers = rows[0].map(h => h.toLowerCase().trim());
            const dataRows = rows.slice(1);

            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;
            const errorMessages = [];
            const importedItems = [];

            // Process each row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];

                // Skip empty rows
                if (row.every(cell => !cell || cell.trim() === '')) {
                    continue;
                }

                const validation = validateCSVRow(row, headers, i + 2);

                if (validation.errors.length > 0) {
                    errorCount++;
                    errorMessages.push(...validation.errors);
                    continue;
                }

                const itemData = validation.item;

                // Check for duplicate serial number
                if (itemData.serial && itemData.serial.trim() !== '') {
                    const existingItem = items.find(item =>
                        item.serial && item.serial.toLowerCase() === itemData.serial.toLowerCase()
                    );
                    if (existingItem) {
                        skipCount++;
                        errorMessages.push(`Ligne ${i + 2}: Article ignoré - Numéro de série "${itemData.serial}" déjà existant`);
                        continue;
                    }
                }

                // Create new item
                const newItem = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: itemData.name.trim(),
                    model: itemData.model ? itemData.model.trim() : '',
                    quantity: parseInt(itemData.quantity) || 0,
                    alert_threshold: itemData.alert_threshold ? parseInt(itemData.alert_threshold) : 5,
                    category: itemData.category.toLowerCase().trim(),
                    serial: itemData.serial ? itemData.serial.trim() : '',
                    location: itemData.location ? itemData.location.trim() : '',
                    supplier: itemData.supplier ? itemData.supplier.trim() : '',
                    purchase_date: itemData.purchase_date ? itemData.purchase_date.trim() : '',
                    price: itemData.price ? parseFloat(itemData.price) : 0,
                    photo: itemData.photo ? itemData.photo.trim() : '',
                    notes: itemData.notes ? itemData.notes.trim() : '',
                    history: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                importedItems.push(newItem);
                successCount++;

                // Small delay to avoid overwhelming the system
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // Save imported items
            if (importedItems.length > 0) {
                for (const item of importedItems) {
                    items.push(item);

                    // Add audit log
                    addAuditLog('create', 'item', {
                        itemId: item.id,
                        itemName: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        source: 'csv_import'
                    });
                }

                await saveItems();
                updateStats();
                renderItems();
            }

            // Display results
            let resultsHTML = '<div>';

            if (successCount > 0) {
                resultsHTML += `
                    <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <strong>✅ Succès:</strong> ${successCount} article(s) importé(s) avec succès
                    </div>
                `;
            }

            if (skipCount > 0) {
                resultsHTML += `
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <strong>⚠️ Ignorés:</strong> ${skipCount} article(s) ignoré(s) (numéros de série existants)
                    </div>
                `;
            }

            if (errorCount > 0) {
                resultsHTML += `
                    <div style="background: #f8d7da; border: 1px solid #dc3545; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <strong>❌ Erreurs:</strong> ${errorCount} ligne(s) avec des erreurs
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; font-weight: bold;">Voir les erreurs détaillées</summary>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                                ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
                            </ul>
                        </details>
                    </div>
                `;
            }

            resultsHTML += '</div>';
            resultsDiv.innerHTML = resultsHTML;
            resultsDiv.style.display = 'block';

            if (successCount > 0) {
                showSuccess(`Import terminé: ${successCount} article(s) importé(s)`);
            } else if (errorCount > 0 || skipCount > 0) {
                showToast('Attention', 'Import terminé avec des avertissements', 'warning');
            }

        } catch (error) {
            console.error('Erreur lors de l\'import CSV:', error);
            showError('Erreur lors de l\'import du fichier CSV: ' + error.message);
        }
    };

    reader.onerror = function() {
        showError('Erreur lors de la lecture du fichier');
    };

    reader.readAsText(file, 'UTF-8');
}

// Advanced Statistics Dashboard
let statsCharts = {}; // Store chart instances

function showStatsModal() {
    // Destroy existing charts
    Object.keys(statsCharts).forEach(key => {
        if (statsCharts[key]) {
            statsCharts[key].destroy();
        }
    });
    statsCharts = {};

    // Show modal
    document.getElementById('stats-modal').classList.add('show');

    // Calculate and display KPIs
    calculateKPIs();

    // Create charts with a small delay to ensure modal is fully rendered
    setTimeout(() => {
        createCategoryChart();
        createStockStatusChart();
        createValueChart();
        createLocationChart();
        createActivityChart();
    }, 100);
}

function closeStatsModal() {
    document.getElementById('stats-modal').classList.remove('show');
}

function calculateKPIs() {
    // Total value
    const totalValue = items.reduce((sum, item) => {
        return sum + (item.quantity * (item.price || 0));
    }, 0);
    document.getElementById('kpi-total-value').textContent = totalValue.toFixed(2) + ' CHF';

    // Average price
    const itemsWithPrice = items.filter(item => item.price && item.price > 0);
    const avgPrice = itemsWithPrice.length > 0
        ? itemsWithPrice.reduce((sum, item) => sum + item.price, 0) / itemsWithPrice.length
        : 0;
    document.getElementById('kpi-avg-price').textContent = avgPrice.toFixed(2) + ' CHF';

    // Rotation rate (items with stock movements)
    const itemsWithMovements = items.filter(item => item.history && item.history.length > 0);
    const rotationRate = items.length > 0 ? (itemsWithMovements.length / items.length * 100) : 0;
    document.getElementById('kpi-rotation').textContent = rotationRate.toFixed(1) + '%';

    // Active items (items with stock > 0)
    const activeItems = items.filter(item => item.quantity > 0).length;
    document.getElementById('kpi-active-items').textContent = activeItems;
}

function createCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

    // Group items by category
    const categoryData = {};
    items.forEach(item => {
        categoryData[item.category] = (categoryData[item.category] || 0) + 1;
    });

    const labels = Object.keys(categoryData).map(cat => categoryLabels[cat] || cat);
    const data = Object.values(categoryData);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140'
    ];

    statsCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function createStockStatusChart() {
    const ctx = document.getElementById('stock-status-chart');
    if (!ctx) return;

    const inStock = items.filter(item => item.quantity > item.alert_threshold).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.alert_threshold).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;

    statsCharts.stockStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['En stock', 'Stock faible', 'Épuisé'],
            datasets: [{
                data: [inStock, lowStock, outOfStock],
                backgroundColor: ['#43e97b', '#ffc107', '#f5576c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function createValueChart() {
    const ctx = document.getElementById('value-chart');
    if (!ctx) return;

    // Calculate value by category
    const categoryValue = {};
    items.forEach(item => {
        const value = item.quantity * (item.price || 0);
        categoryValue[item.category] = (categoryValue[item.category] || 0) + value;
    });

    const labels = Object.keys(categoryValue).map(cat => categoryLabels[cat] || cat);
    const data = Object.values(categoryValue);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140'
    ];

    statsCharts.value = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valeur (CHF)',
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0) + ' CHF';
                        }
                    }
                }
            }
        }
    });
}

function createLocationChart() {
    const ctx = document.getElementById('location-chart');
    if (!ctx) return;

    // Count items by location
    const locationData = {};
    items.forEach(item => {
        if (item.location) {
            locationData[item.location] = (locationData[item.location] || 0) + item.quantity;
        }
    });

    // Get top 5 locations
    const sortedLocations = Object.entries(locationData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels = sortedLocations.map(loc => loc[0]);
    const data = sortedLocations.map(loc => loc[1]);

    statsCharts.location = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantité',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function createActivityChart() {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;

    // Get last 6 months of activity from audit logs
    const now = new Date();
    const monthsData = [];
    const monthLabels = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));

        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        const monthLogs = auditLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= date && logDate < nextMonth && log.targetType === 'item';
        });

        monthsData.push(monthLogs.length);
    }

    statsCharts.activity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Actions',
                data: monthsData,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Advanced Search
let advancedSearchActive = false;
let advancedSearchCriteria = {};

function showAdvancedSearchModal() {
    document.getElementById('advanced-search-modal').classList.add('show');
    updateAdvancedSearchCount();
}

function closeAdvancedSearchModal() {
    document.getElementById('advanced-search-modal').classList.remove('show');
}

function resetAdvancedSearch() {
    // Clear all form fields
    document.getElementById('adv-name').value = '';
    document.getElementById('adv-model').value = '';
    document.getElementById('adv-category').value = '';
    document.getElementById('adv-stock-status').value = '';
    document.getElementById('adv-quantity-min').value = '';
    document.getElementById('adv-quantity-max').value = '';
    document.getElementById('adv-price-min').value = '';
    document.getElementById('adv-price-max').value = '';
    document.getElementById('adv-location').value = '';
    document.getElementById('adv-supplier').value = '';
    document.getElementById('adv-purchase-date-from').value = '';
    document.getElementById('adv-purchase-date-to').value = '';
    document.getElementById('adv-serial').value = '';
    document.getElementById('adv-notes').value = '';

    // Reset search
    advancedSearchActive = false;
    advancedSearchCriteria = {};

    // Clear basic search
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';

    // Refresh display
    filterItems();
    updateAdvancedSearchCount();

    showSuccess('Filtres de recherche réinitialisés');
}

function updateAdvancedSearchCount() {
    const criteria = getAdvancedSearchCriteria();
    const results = filterItemsByAdvancedCriteria(items, criteria);
    document.getElementById('adv-search-count').textContent = `${results.length} article(s) trouvé(s)`;
}

function getAdvancedSearchCriteria() {
    return {
        name: document.getElementById('adv-name').value.trim().toLowerCase(),
        model: document.getElementById('adv-model').value.trim().toLowerCase(),
        category: document.getElementById('adv-category').value,
        stockStatus: document.getElementById('adv-stock-status').value,
        quantityMin: document.getElementById('adv-quantity-min').value,
        quantityMax: document.getElementById('adv-quantity-max').value,
        priceMin: document.getElementById('adv-price-min').value,
        priceMax: document.getElementById('adv-price-max').value,
        location: document.getElementById('adv-location').value.trim().toLowerCase(),
        supplier: document.getElementById('adv-supplier').value.trim().toLowerCase(),
        purchaseDateFrom: document.getElementById('adv-purchase-date-from').value,
        purchaseDateTo: document.getElementById('adv-purchase-date-to').value,
        serial: document.getElementById('adv-serial').value.trim().toLowerCase(),
        notes: document.getElementById('adv-notes').value.trim().toLowerCase()
    };
}

function filterItemsByAdvancedCriteria(itemsToFilter, criteria) {
    return itemsToFilter.filter(item => {
        // Name filter
        if (criteria.name && !item.name.toLowerCase().includes(criteria.name)) {
            return false;
        }

        // Model filter
        if (criteria.model && !(item.model || '').toLowerCase().includes(criteria.model)) {
            return false;
        }

        // Category filter
        if (criteria.category && item.category !== criteria.category) {
            return false;
        }

        // Stock status filter
        if (criteria.stockStatus) {
            if (criteria.stockStatus === 'in-stock' && item.quantity <= item.alert_threshold) {
                return false;
            }
            if (criteria.stockStatus === 'low-stock' && (item.quantity === 0 || item.quantity > item.alert_threshold)) {
                return false;
            }
            if (criteria.stockStatus === 'out-stock' && item.quantity !== 0) {
                return false;
            }
        }

        // Quantity filters
        if (criteria.quantityMin && item.quantity < parseInt(criteria.quantityMin)) {
            return false;
        }
        if (criteria.quantityMax && item.quantity > parseInt(criteria.quantityMax)) {
            return false;
        }

        // Price filters
        if (criteria.priceMin && (item.price || 0) < parseFloat(criteria.priceMin)) {
            return false;
        }
        if (criteria.priceMax && (item.price || 0) > parseFloat(criteria.priceMax)) {
            return false;
        }

        // Location filter
        if (criteria.location && !(item.location || '').toLowerCase().includes(criteria.location)) {
            return false;
        }

        // Supplier filter
        if (criteria.supplier && !(item.supplier || '').toLowerCase().includes(criteria.supplier)) {
            return false;
        }

        // Purchase date filters
        if (criteria.purchaseDateFrom && item.purchase_date && item.purchase_date < criteria.purchaseDateFrom) {
            return false;
        }
        if (criteria.purchaseDateTo && item.purchase_date && item.purchase_date > criteria.purchaseDateTo) {
            return false;
        }

        // Serial filter
        if (criteria.serial && !(item.serial || '').toLowerCase().includes(criteria.serial)) {
            return false;
        }

        // Notes filter
        if (criteria.notes && !(item.notes || '').toLowerCase().includes(criteria.notes)) {
            return false;
        }

        return true;
    });
}

function applyAdvancedSearch(event) {
    event.preventDefault();

    advancedSearchCriteria = getAdvancedSearchCriteria();
    advancedSearchActive = true;

    // Clear basic search filters
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';

    // Apply advanced search
    filterItems();

    // Close modal
    closeAdvancedSearchModal();

    showSuccess('Recherche avancée appliquée');
}

// Maintenance Management
let maintenanceRecords = JSON.parse(localStorage.getItem('maintenanceRecords') || '[]');

function showMaintenanceModal() {
    document.getElementById('maintenance-modal').classList.add('show');
    renderMaintenanceList();
}

function closeMaintenanceModal() {
    document.getElementById('maintenance-modal').classList.remove('show');
}

function showAddMaintenanceModal() {
    // Populate items dropdown
    const select = document.getElementById('maint-item');
    select.innerHTML = '<option value="">-- Sélectionner un article --</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} ${item.model ? '- ' + item.model : ''}`;
        select.appendChild(option);
    });

    // Set default start date to today
    document.getElementById('maint-start-date').valueAsDate = new Date();

    document.getElementById('add-maintenance-modal').classList.add('show');
}

function closeAddMaintenanceModal() {
    document.getElementById('add-maintenance-modal').classList.remove('show');
    document.getElementById('add-maintenance-form').reset();
}

function addMaintenance(event) {
    event.preventDefault();

    const itemId = document.getElementById('maint-item').value;
    const item = items.find(i => i.id === itemId);

    const maintenance = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        itemId: itemId,
        itemName: item ? item.name : '',
        type: document.getElementById('maint-type').value,
        startDate: document.getElementById('maint-start-date').value,
        endDate: document.getElementById('maint-end-date').value || null,
        cost: parseFloat(document.getElementById('maint-cost').value) || 0,
        technician: document.getElementById('maint-technician').value,
        description: document.getElementById('maint-description').value,
        notes: document.getElementById('maint-notes').value,
        status: 'in-progress',
        completedDate: null,
        createdAt: new Date().toISOString(),
        createdBy: currentUser ? currentUser.username : 'Unknown'
    };

    maintenanceRecords.push(maintenance);
    localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));

    // Add audit log
    addAuditLog('create', 'maintenance', {
        maintenanceId: maintenance.id,
        itemName: maintenance.itemName,
        type: maintenance.type
    });

    closeAddMaintenanceModal();
    renderMaintenanceList();
    showSuccess('Maintenance enregistrée');
}

function completeMaintenance(maintenanceId) {
    const maintenance = maintenanceRecords.find(m => m.id === maintenanceId);
    if (!maintenance) return;

    if (confirm('Marquer cette maintenance comme terminée?')) {
        maintenance.status = 'completed';
        maintenance.completedDate = new Date().toISOString();
        localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));

        // Add audit log
        addAuditLog('update', 'maintenance', {
            maintenanceId: maintenance.id,
            itemName: maintenance.itemName,
            action: 'completed'
        });

        renderMaintenanceList();
        showSuccess('Maintenance marquée comme terminée');
    }
}

function deleteMaintenance(maintenanceId) {
    if (!hasPermission('canDeleteItems')) {
        showError('Vous n\'avez pas la permission de supprimer des maintenances');
        return;
    }

    const maintenance = maintenanceRecords.find(m => m.id === maintenanceId);
    if (!maintenance) return;

    if (confirm(`Supprimer cette maintenance pour "${maintenance.itemName}"?`)) {
        maintenanceRecords = maintenanceRecords.filter(m => m.id !== maintenanceId);
        localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));

        // Add audit log
        addAuditLog('delete', 'maintenance', {
            maintenanceId: maintenanceId,
            itemName: maintenance.itemName
        });

        renderMaintenanceList();
        showSuccess('Maintenance supprimée');
    }
}

function filterMaintenances() {
    renderMaintenanceList();
}

function renderMaintenanceList() {
    const container = document.getElementById('maintenance-list');
    const filter = document.getElementById('maintenance-filter').value;

    let filtered = maintenanceRecords;
    if (filter === 'in-progress') {
        filtered = maintenanceRecords.filter(m => m.status === 'in-progress');
    } else if (filter === 'completed') {
        filtered = maintenanceRecords.filter(m => m.status === 'completed');
    }

    // Sort by date (newest first)
    filtered = filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔧</div>
                <h3>Aucune maintenance enregistrée</h3>
                <p>Cliquez sur "Nouvelle maintenance" pour commencer</p>
            </div>
        `;
        return;
    }

    const typeLabels = {
        'maintenance': '🔧 Maintenance',
        'repair': '🛠️ Réparation',
        'upgrade': '⬆️ Mise à niveau',
        'cleaning': '🧹 Nettoyage',
        'calibration': '⚙️ Calibration'
    };

    container.innerHTML = filtered.map(maintenance => {
        const statusClass = maintenance.status === 'completed' ? 'success' : 'warning';
        const statusLabel = maintenance.status === 'completed' ? 'Terminée' : 'En cours';
        const statusIcon = maintenance.status === 'completed' ? '✅' : '🔄';

        return `
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0; color: #333;">
                            ${typeLabels[maintenance.type] || maintenance.type} - ${maintenance.itemName}
                        </h3>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${statusIcon} <span style="color: ${statusClass === 'success' ? '#28a745' : '#ffc107'}; font-weight: bold;">${statusLabel}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        ${maintenance.status === 'in-progress' && hasPermission('canEditItems') ? `
                            <button class="btn btn-success btn-small" onclick="completeMaintenance('${maintenance.id}')" title="Marquer comme terminée">
                                ✓ Terminer
                            </button>
                        ` : ''}
                        ${hasPermission('canDeleteItems') ? `
                            <button class="btn btn-danger btn-small" onclick="deleteMaintenance('${maintenance.id}')" title="Supprimer">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <strong>Description:</strong> ${maintenance.description}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9rem;">
                    <div>
                        <strong>📅 Début:</strong> ${formatDate(maintenance.startDate)}
                    </div>
                    ${maintenance.endDate ? `
                        <div>
                            <strong>📅 Fin prévue:</strong> ${formatDate(maintenance.endDate)}
                        </div>
                    ` : ''}
                    ${maintenance.completedDate ? `
                        <div>
                            <strong>✅ Terminée le:</strong> ${formatDate(maintenance.completedDate.split('T')[0])}
                        </div>
                    ` : ''}
                    ${maintenance.cost > 0 ? `
                        <div>
                            <strong>💰 Coût:</strong> ${maintenance.cost.toFixed(2)} CHF
                        </div>
                    ` : ''}
                    ${maintenance.technician ? `
                        <div>
                            <strong>👤 Technicien:</strong> ${maintenance.technician}
                        </div>
                    ` : ''}
                </div>

                ${maintenance.notes ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.85rem; color: #666;">
                        <strong>Notes:</strong> ${maintenance.notes}
                    </div>
                ` : ''}

                <div style="margin-top: 10px; font-size: 0.8rem; color: #999;">
                    Créée le ${new Date(maintenance.createdAt).toLocaleString('fr-FR')} par ${maintenance.createdBy}
                </div>
            </div>
        `;
    }).join('');
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

    // Ctrl+Shift+A: Emergency admin access
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        emergencyAdminAccess();
    }
});

// Emergency Admin Access
function emergencyAdminAccess() {
    if (confirm('Accès admin d\'urgence. Continuer ?')) {
        // Switch to admin user
        const adminUser = users.find(u => u.role === 'admin') || users[0];
        currentUser = adminUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        updateUserInterface();
        renderItems();

        showToast('Accès restauré', 'Vous êtes maintenant connecté en tant qu\'administrateur', 'success');
    }
}
