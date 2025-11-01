const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');

console.log('Starting database migration...');
console.log('Database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('✗ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✓ Connected to database');
});

// Add expected_return_date column to stock_history table
db.run(`ALTER TABLE stock_history ADD COLUMN expected_return_date TEXT`, (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('✓ Column expected_return_date already exists, skipping...');
        } else {
            console.error('✗ Error adding column:', err.message);
            db.close();
            process.exit(1);
        }
    } else {
        console.log('✓ Added expected_return_date column to stock_history table');
    }

    console.log('\n✓ Migration successful!\n');
    console.log('Database schema updated:');
    console.log('- stock_history.expected_return_date (TEXT, nullable)');
    console.log('\nYou can now restart your application.');

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✓ Database closed');
        }
    });
});
