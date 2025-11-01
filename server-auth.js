require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const app = express();
const PORT = process.env.PORT || 3000;

// Azure AD Configuration
const azureConfig = {
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.REDIRECT_URI || 'http://localhost:3000/auth/redirect',
    allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
    validateIssuer: true,
    passReqToCallback: false,
    scope: ['profile', 'email', 'openid'],
    loggingLevel: 'info'
};

// Passport Azure AD Strategy
passport.use(new OIDCStrategy(azureConfig,
    function(iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
            return done(new Error("No OID found in user profile"), null);
        }

        // Créer un objet utilisateur simplifié
        const user = {
            oid: profile.oid,
            name: profile.displayName || profile.name,
            email: profile._json.email || profile._json.preferred_username,
            username: profile._json.preferred_username
        };

        return done(null, user);
    }
));

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware pour vérifier l'authentification
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Please login first' });
}

// Database setup
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
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS stock_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            previous_quantity INTEGER NOT NULL,
            new_quantity INTEGER NOT NULL,
            note TEXT,
            date TEXT NOT NULL,
            user_email TEXT,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating stock_history table:', err);
        } else {
            console.log('Stock history table ready');
        }
    });
}

// Authentication Routes

// Page de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Démarrer l'authentification avec Azure AD
app.get('/auth/signin',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' })
);

// Callback après authentification
app.post('/auth/redirect',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

// Déconnexion
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy(() => {
            res.redirect('/login');
        });
    });
});

// Route pour vérifier le statut d'authentification
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                name: req.user.name,
                email: req.user.email,
                username: req.user.username
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// API Routes (toutes protégées par authentification)

// Get all items
app.get('/api/items', ensureAuthenticated, (req, res) => {
    db.all('SELECT * FROM items ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single item with history
app.get('/api/items/:id', ensureAuthenticated, (req, res) => {
    const itemId = req.params.id;

    db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        // Get history for this item
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
});

// Create new item
app.post('/api/items', ensureAuthenticated, (req, res) => {
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
                        new_quantity, note, date, user_email
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, 'add', quantity, 0, quantity, 'Stock initial', createdAt, req.user.email],
                    (err) => {
                        if (err) {
                            console.error('Error adding initial history:', err);
                        }
                    }
                );
            }

            res.json({
                id: id,
                message: 'Item created successfully'
            });
        }
    );
});

// Update item
app.put('/api/items/:id', ensureAuthenticated, (req, res) => {
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
                res.status(404).json({ error: 'Item not found' });
                return;
            }
            res.json({ message: 'Item updated successfully' });
        }
    );
});

// Delete item
app.delete('/api/items/:id', ensureAuthenticated, (req, res) => {
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
                res.status(404).json({ error: 'Item not found' });
                return;
            }
            res.json({ message: 'Item deleted successfully' });
        });
    });
});

// Adjust stock
app.post('/api/items/:id/adjust', ensureAuthenticated, (req, res) => {
    const itemId = req.params.id;
    const { type, quantity, note, person } = req.body;

    if (!type || !quantity) {
        res.status(400).json({ error: 'Type and quantity are required' });
        return;
    }

    // Get current item
    db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        const previousQuantity = item.quantity;
        let newQuantity;

        if (type === 'add') {
            newQuantity = previousQuantity + quantity;
        } else if (type === 'remove') {
            if (previousQuantity < quantity) {
                res.status(400).json({
                    error: 'Cannot remove more units than available in stock'
                });
                return;
            }
            newQuantity = previousQuantity - quantity;
        } else {
            res.status(400).json({ error: 'Invalid adjustment type' });
            return;
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

                // Add to history with user email
                db.run(
                    `INSERT INTO stock_history (
                        item_id, type, quantity, previous_quantity,
                        new_quantity, note, person, date, user_email
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [itemId, type, quantity, previousQuantity, newQuantity, note || null, person || null, date, req.user.email],
                    function (err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        res.json({
                            message: 'Stock adjusted successfully',
                            previousQuantity,
                            newQuantity,
                            adjustedBy: req.user.email
                        });
                    }
                );
            }
        );
    });
});

// Get item history
app.get('/api/items/:id/history', ensureAuthenticated, (req, res) => {
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
});

// Get statistics
app.get('/api/statistics', ensureAuthenticated, (req, res) => {
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
app.get('/api/alerts', ensureAuthenticated, (req, res) => {
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

// Serve index.html for authenticated users
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'index-auth.html'));
    } else {
        res.redirect('/login');
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database: ${dbPath}`);
    console.log(`Authentication: Azure AD enabled`);
    console.log(`Login at: http://localhost:${PORT}/login`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
