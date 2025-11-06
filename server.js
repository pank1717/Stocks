const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const emailService = require('./email-service');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

// API Routes

// Get all items
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single item with history
app.get('/api/items/:id', (req, res) => {
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
app.post('/api/items', (req, res) => {
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
                    [id, 'add', quantity, 0, quantity, 'Stock initial', createdAt],
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
app.put('/api/items/:id', (req, res) => {
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
app.delete('/api/items/:id', (req, res) => {
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
app.post('/api/items/:id/adjust', (req, res) => {
    const itemId = req.params.id;
    const { type, quantity, note, person, expectedReturnDate } = req.body;

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

                        res.json({
                            message: 'Stock adjusted successfully',
                            previousQuantity,
                            newQuantity
                        });
                    }
                );
            }
        );
    });
});

// Get item history
app.get('/api/items/:id/history', (req, res) => {
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
app.get('/api/statistics', (req, res) => {
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
app.get('/api/alerts', (req, res) => {
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

// =======================
// EMAIL & NOTIFICATIONS
// =======================

// Configure email service
app.post('/api/settings/email', (req, res) => {
    const { enabled, host, port, secure, user, pass, from, alertEmails } = req.body;

    const config = {
        enabled: enabled || false,
        host: host || '',
        port: parseInt(port) || 587,
        secure: secure || false,
        auth: {
            user: user || '',
            pass: pass || ''
        },
        from: from || 'stock@example.com',
        alertEmails: Array.isArray(alertEmails) ? alertEmails : []
    };

    emailService.configure(config);
    res.json({ message: 'Configuration email mise à jour', config: { ...config, auth: { user: config.auth.user, pass: '***' } } });
});

// Test email configuration
app.post('/api/email/test', async (req, res) => {
    const { toEmail } = req.body;

    try {
        const result = await emailService.sendTestEmail(toEmail || 'test@example.com');
        res.json({ success: true, message: 'Email de test envoyé', result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send low stock alert manually
app.post('/api/email/send-alert', (req, res) => {
    db.all(
        'SELECT * FROM items WHERE quantity > 0 AND quantity <= alert_threshold ORDER BY quantity ASC',
        [],
        async (err, items) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (items.length === 0) {
                return res.json({ sent: false, message: 'Aucun article en alerte de stock faible' });
            }

            const result = await emailService.sendLowStockAlert(items);
            res.json({ ...result, itemsCount: items.length });
        }
    );
});

// QR Code generation API
app.post('/api/qrcode', async (req, res) => {
    try {
        const { data, width = 300 } = req.body;

        if (!data) {
            return res.status(400).json({ error: 'Missing data parameter' });
        }

        // Generate QR code as data URL
        const dataURL = await QRCode.toDataURL(data, {
            width: width,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({ success: true, dataURL });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database: ${dbPath}`);
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
