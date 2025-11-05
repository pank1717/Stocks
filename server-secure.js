const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// SECURITY MIDDLEWARES
// =========================

// Helmet: Secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS: Restrict to specific origin (change in production)
const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting: Prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with httpOnly cookies
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: __dirname
    }),
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production-use-random-string',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        sameSite: 'strict'
    },
    name: 'sessionId' // Don't use default 'connect.sid'
}));

// Static files
app.use(express.static(path.join(__dirname)));

// =========================
// DATABASE SETUP
// =========================

const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Items table
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            model TEXT,
            quantity INTEGER DEFAULT 0,
            category TEXT NOT NULL,
            serial TEXT,
            location TEXT,
            supplier TEXT,
            purchase_date TEXT,
            price REAL DEFAULT 0,
            photo TEXT,
            notes TEXT,
            alert_threshold INTEGER DEFAULT 5,
            created_at TEXT,
            updated_at TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Error creating items table:', err);
        } else {
            console.log('Items table ready');
            // Create indexes for better performance
            db.run('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)');
            db.run('CREATE INDEX IF NOT EXISTS idx_items_quantity ON items(quantity)');
        }
    });

    // Stock history table
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            previous_quantity INTEGER NOT NULL,
            new_quantity INTEGER NOT NULL,
            note TEXT,
            person TEXT,
            expected_return_date TEXT,
            date TEXT NOT NULL,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating stock_history table:', err);
        } else {
            console.log('Stock history table ready');
            db.run('CREATE INDEX IF NOT EXISTS idx_stock_history_item_id ON stock_history(item_id)');
        }
    });

    // Users table with bcrypt hashed passwords
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT NOT NULL DEFAULT 'viewer',
            created_at TEXT NOT NULL,
            updated_at TEXT,
            last_login TEXT,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TEXT
        )
    `, async (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');

            // Create default admin user if no users exist
            db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
                if (!err && row.count === 0) {
                    const hashedPassword = await bcrypt.hash('admin', 10);
                    db.run(`
                        INSERT INTO users (username, password, email, role, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    `, ['admin', hashedPassword, 'admin@example.com', 'admin', new Date().toISOString()],
                    (err) => {
                        if (err) {
                            console.error('Error creating default admin:', err);
                        } else {
                            console.log('✅ Default admin user created (username: admin, password: admin)');
                            console.log('⚠️  IMPORTANT: Change this password immediately!');
                        }
                    });
                }
            });
        }
    });

    // Audit logs table
    db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating audit_logs table:', err);
        } else {
            console.log('Audit logs table ready');
            db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
        }
    });
}

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
}

function hasRole(roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userRole) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        if (!roles.includes(req.session.userRole)) {
            return res.status(403).json({ error: 'Accès refusé. Permissions insuffisantes.' });
        }

        next();
    };
}

// =========================
// AUDIT LOG HELPER
// =========================

function logAudit(req, action, targetType, targetId, details) {
    const userId = req.session?.userId || null;
    const username = req.session?.username || 'Anonymous';
    const ipAddress = req.ip || req.connection.remoteAddress;

    db.run(`
        INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, username, action, targetType, targetId, JSON.stringify(details), ipAddress, new Date().toISOString()]);
}

// =========================
// AUTHENTICATION ROUTES
// =========================

// Login
app.post('/api/auth/login',
    authLimiter,
    [
        body('username').trim().notEmpty().withMessage('Username requis'),
        body('password').notEmpty().withMessage('Password requis')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (!user) {
                logAudit(req, 'login_failed', 'user', null, { username, reason: 'user_not_found' });
                return res.status(401).json({ error: 'Identifiants incorrects' });
            }

            // Check if account is locked
            if (user.locked_until) {
                const lockedUntil = new Date(user.locked_until);
                if (lockedUntil > new Date()) {
                    const minutesRemaining = Math.ceil((lockedUntil - new Date()) / 60000);
                    return res.status(423).json({
                        error: `Compte verrouillé. Réessayez dans ${minutesRemaining} minute(s).`
                    });
                } else {
                    // Unlock account
                    db.run('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?', [user.id]);
                }
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                // Increment failed attempts
                const newFailedAttempts = user.failed_login_attempts + 1;
                let lockedUntil = null;

                // Lock account after 5 failed attempts for 15 minutes
                if (newFailedAttempts >= 5) {
                    lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                }

                db.run('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                    [newFailedAttempts, lockedUntil, user.id]);

                logAudit(req, 'login_failed', 'user', user.id, { username, reason: 'wrong_password', attempts: newFailedAttempts });

                if (lockedUntil) {
                    return res.status(423).json({
                        error: 'Trop de tentatives échouées. Compte verrouillé pour 15 minutes.'
                    });
                }

                return res.status(401).json({
                    error: 'Identifiants incorrects',
                    attemptsRemaining: 5 - newFailedAttempts
                });
            }

            // Success: Reset failed attempts and create session
            db.run('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?',
                [new Date().toISOString(), user.id]);

            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.userRole = user.role;
            req.session.email = user.email;

            logAudit(req, 'login_success', 'user', user.id, { username });

            res.json({
                message: 'Connexion réussie',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        });
    }
);

// Logout
app.post('/api/auth/logout', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    logAudit(req, 'logout', 'user', userId, {});

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.json({ message: 'Déconnexion réussie' });
    });
});

// Get current user
app.get('/api/auth/me', isAuthenticated, (req, res) => {
    db.get('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
        [req.session.userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            res.json(user);
        }
    );
});

// Change password
app.post('/api/auth/change-password',
    isAuthenticated,
    [
        body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
        body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.session.userId;

        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatch) {
                logAudit(req, 'password_change_failed', 'user', userId, { reason: 'wrong_current_password' });
                return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
                [hashedNewPassword, new Date().toISOString(), userId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
                    }

                    logAudit(req, 'password_changed', 'user', userId, {});
                    res.json({ message: 'Mot de passe modifié avec succès' });
                }
            );
        });
    }
);

// =========================
// USER MANAGEMENT ROUTES (Admin only)
// =========================

// Get all users
app.get('/api/users', isAuthenticated, hasRole(['admin']), (req, res) => {
    db.all('SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Create user
app.post('/api/users',
    isAuthenticated,
    hasRole(['admin']),
    [
        body('username').trim().isLength({ min: 3 }).withMessage('Username doit contenir au moins 3 caractères'),
        body('password').isLength({ min: 8 }).withMessage('Password doit contenir au moins 8 caractères'),
        body('email').isEmail().withMessage('Email invalide'),
        body('role').isIn(['admin', 'manager', 'viewer']).withMessage('Rôle invalide')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, email, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`
            INSERT INTO users (username, password, email, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        `, [username, hashedPassword, email, role, new Date().toISOString()],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Username ou email déjà utilisé' });
                }
                return res.status(500).json({ error: err.message });
            }

            logAudit(req, 'user_created', 'user', this.lastID, { username, email, role });
            res.status(201).json({
                id: this.lastID,
                message: 'Utilisateur créé avec succès'
            });
        });
    }
);

// Delete user
app.delete('/api/users/:id',
    isAuthenticated,
    hasRole(['admin']),
    param('id').isInt().withMessage('ID invalide'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = parseInt(req.params.id);

        // Prevent deleting yourself
        if (userId === req.session.userId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            logAudit(req, 'user_deleted', 'user', userId, {});
            res.json({ message: 'Utilisateur supprimé avec succès' });
        });
    }
);

// =========================
// ITEMS ROUTES (with validation)
// =========================

// Get all items
app.get('/api/items', isAuthenticated, apiLimiter, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default high for backward compatibility
    const offset = (page - 1) * limit;

    db.all('SELECT * FROM items ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Get single item with history
app.get('/api/items/:id',
    isAuthenticated,
    param('id').trim().notEmpty().withMessage('ID requis'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const itemId = req.params.id;

        db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!item) {
                res.status(404).json({ error: 'Article non trouvé' });
                return;
            }

            db.all(
                'SELECT * FROM stock_history WHERE item_id = ? ORDER BY date DESC',
                [itemId],
                (err, history) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    item.history = history;
                    res.json(item);
                }
            );
        });
    }
);

// Create new item
app.post('/api/items',
    isAuthenticated,
    hasRole(['admin', 'manager']),
    apiLimiter,
    [
        body('name').trim().notEmpty().withMessage('Nom requis').isLength({ max: 255 }),
        body('category').isIn(['informatique', 'peripheriques', 'ecrans', 'connectique', 'alimentation', 'docking', 'audio', 'reseau', 'stockage', 'mobile']).withMessage('Catégorie invalide'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantité doit être >= 0'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Prix doit être >= 0'),
        body('alertThreshold').optional().isInt({ min: 0 }).withMessage('Seuil d\'alerte invalide')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            id,
            name,
            model,
            quantity,
            category,
            serial,
            location,
            supplier,
            purchaseDate,
            price,
            photo,
            notes,
            alertThreshold
        } = req.body;

        const createdAt = new Date().toISOString();

        db.run(
            `INSERT INTO items (
                id, name, model, quantity, category, serial, location,
                supplier, purchase_date, price, photo, notes, alert_threshold, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                name,
                model || null,
                quantity || 0,
                category,
                serial || null,
                location || null,
                supplier || null,
                purchaseDate || null,
                price || 0,
                photo || null,
                notes || null,
                alertThreshold || 5,
                createdAt
            ],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Add initial stock entry if quantity > 0
                if (quantity > 0) {
                    db.run(
                        `INSERT INTO stock_history (
                            item_id, type, quantity, previous_quantity,
                            new_quantity, note, date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [id, 'add', quantity, 0, quantity, 'Stock initial', createdAt]
                    );
                }

                logAudit(req, 'item_created', 'item', id, { name, category, quantity });

                res.json({
                    id: id,
                    message: 'Article créé avec succès'
                });
            }
        );
    }
);

// Update item
app.put('/api/items/:id',
    isAuthenticated,
    hasRole(['admin', 'manager']),
    apiLimiter,
    [
        param('id').trim().notEmpty().withMessage('ID requis'),
        body('name').trim().notEmpty().withMessage('Nom requis').isLength({ max: 255 }),
        body('category').isIn(['informatique', 'peripheriques', 'ecrans', 'connectique', 'alimentation', 'docking', 'audio', 'reseau', 'stockage', 'mobile']).withMessage('Catégorie invalide'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Prix doit être >= 0'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const itemId = req.params.id;
        const {
            name,
            model,
            category,
            serial,
            location,
            supplier,
            purchaseDate,
            price,
            photo,
            notes,
            alertThreshold
        } = req.body;

        const updatedAt = new Date().toISOString();

        db.run(
            `UPDATE items SET
                name = ?,
                model = ?,
                category = ?,
                serial = ?,
                location = ?,
                supplier = ?,
                purchase_date = ?,
                price = ?,
                photo = ?,
                notes = ?,
                alert_threshold = ?,
                updated_at = ?
            WHERE id = ?`,
            [
                name,
                model || null,
                category,
                serial || null,
                location || null,
                supplier || null,
                purchaseDate || null,
                price || 0,
                photo || null,
                notes || null,
                alertThreshold || 5,
                updatedAt,
                itemId
            ],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: 'Article non trouvé' });
                    return;
                }

                logAudit(req, 'item_updated', 'item', itemId, { name, category });
                res.json({ message: 'Article mis à jour avec succès' });
            }
        );
    }
);

// Delete item
app.delete('/api/items/:id',
    isAuthenticated,
    hasRole(['admin']),
    param('id').trim().notEmpty().withMessage('ID requis'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const itemId = req.params.id;

        // First delete history
        db.run('DELETE FROM stock_history WHERE item_id = ?', [itemId], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Then delete item
            db.run('DELETE FROM items WHERE id = ?', [itemId], function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: 'Article non trouvé' });
                    return;
                }

                logAudit(req, 'item_deleted', 'item', itemId, {});
                res.json({ message: 'Article supprimé avec succès' });
            });
        });
    }
);

// Adjust stock
app.post('/api/items/:id/adjust',
    isAuthenticated,
    hasRole(['admin', 'manager']),
    [
        param('id').trim().notEmpty().withMessage('ID requis'),
        body('type').isIn(['add', 'remove']).withMessage('Type invalide'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être >= 1')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const itemId = req.params.id;
        const { type, quantity, note, person, expectedReturnDate } = req.body;

        // Get current item
        db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!item) {
                res.status(404).json({ error: 'Article non trouvé' });
                return;
            }

            const previousQuantity = item.quantity;
            let newQuantity;

            if (type === 'add') {
                newQuantity = previousQuantity + quantity;
            } else if (type === 'remove') {
                if (previousQuantity < quantity) {
                    res.status(400).json({
                        error: 'Impossible de retirer plus d\'unités que disponible en stock'
                    });
                    return;
                }
                newQuantity = previousQuantity - quantity;
            }

            const date = new Date().toISOString();

            // Update item quantity
            db.run(
                'UPDATE items SET quantity = ? WHERE id = ?',
                [newQuantity, itemId],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Add to history
                    db.run(
                        `INSERT INTO stock_history (
                            item_id, type, quantity, previous_quantity,
                            new_quantity, note, person, expected_return_date, date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [itemId, type, quantity, previousQuantity, newQuantity, note || null, person || null, expectedReturnDate || null, date],
                        function (err) {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            logAudit(req, 'stock_adjusted', 'item', itemId, {
                                type,
                                quantity,
                                previousQuantity,
                                newQuantity
                            });

                            res.json({
                                message: 'Stock ajusté avec succès',
                                previousQuantity,
                                newQuantity
                            });
                        }
                    );
                }
            );
        });
    }
);

// Get item history
app.get('/api/items/:id/history',
    isAuthenticated,
    param('id').trim().notEmpty().withMessage('ID requis'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const itemId = req.params.id;

        db.all(
            'SELECT * FROM stock_history WHERE item_id = ? ORDER BY date DESC',
            [itemId],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows);
            }
        );
    }
);

// =========================
// STATISTICS & ALERTS
// =========================

// Get statistics
app.get('/api/statistics', isAuthenticated, (req, res) => {
    db.get(
        `SELECT
            COUNT(*) as total_items,
            SUM(quantity) as total_units,
            SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as in_stock,
            SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
            SUM(CASE WHEN quantity > 0 AND quantity <= alert_threshold THEN 1 ELSE 0 END) as low_stock,
            SUM(quantity * price) as total_value
        FROM items`,
        [],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        }
    );
});

// Get items with low stock (alerts)
app.get('/api/alerts', isAuthenticated, (req, res) => {
    db.all(
        'SELECT * FROM items WHERE quantity > 0 AND quantity <= alert_threshold ORDER BY quantity ASC',
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Get audit logs (admin only)
app.get('/api/audit-logs', isAuthenticated, hasRole(['admin']), (req, res) => {
    const limit = parseInt(req.query.limit) || 100;

    db.all(
        'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// =========================
// SERVE FRONTEND
// =========================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(`\n🚀 Serveur sécurisé démarré sur http://localhost:${PORT}`);
    console.log(`📊 Base de données: ${dbPath}`);
    console.log(`\n🔒 Sécurité activée:`);
    console.log(`   ✅ Sessions httpOnly (2h timeout)`);
    console.log(`   ✅ Bcrypt pour mots de passe`);
    console.log(`   ✅ Rate limiting (5 login attempts / 15min)`);
    console.log(`   ✅ Validation des entrées`);
    console.log(`   ✅ Helmet security headers`);
    console.log(`   ✅ CORS configuré`);
    console.log(`   ✅ Audit logs activés`);
    console.log(`\n⚠️  IMPORTANT: Changez le mot de passe admin par défaut!`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('\n✅ Base de données fermée proprement');
        }
        process.exit(0);
    });
});
