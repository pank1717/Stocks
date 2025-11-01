// Migration script to add alert_threshold column to existing database
// Run this once to upgrade your existing database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');

console.log('Starting database migration...');
console.log('Database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }

    console.log('✓ Connected to database');

    // Add alert_threshold column to items table
    db.run(`ALTER TABLE items ADD COLUMN alert_threshold INTEGER DEFAULT 5`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✓ Column alert_threshold already exists, skipping...');
            } else {
                console.error('✗ Error adding column:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✓ Added alert_threshold column to items table');
        }

        // Verify the migration
        db.all("PRAGMA table_info(items)", [], (err, rows) => {
            if (err) {
                console.error('✗ Error verifying migration:', err);
                db.close();
                process.exit(1);
            }

            const hasThreshold = rows.some(row => row.name === 'alert_threshold');

            if (hasThreshold) {
                console.log('✓ Migration successful!');
                console.log('\nDatabase schema updated:');
                console.log('- items.alert_threshold (INTEGER, default: 5)');
                console.log('\nYou can now restart your application.');
            } else {
                console.log('✗ Migration verification failed');
            }

            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('✓ Database closed');
                }
                process.exit(hasThreshold ? 0 : 1);
            });
        });
    });
});
