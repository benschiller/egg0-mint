const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'valerian',
    host: 'localhost',
    database: 'egg0_db',
    port: 5433
});

async function importMetadata() {
    try {
        const metadata = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '../metadata/egg0_ME_metadata_241110.json'),
                'utf8'
            )
        );

        for (const item of metadata) {
            await pool.query(
                'INSERT INTO inscriptions (id, meta) VALUES ($1, $2)',
                [item.id, item.meta]
            );
        }

        console.log(`Imported ${metadata.length} inscriptions`);
    } catch (error) {
        console.error('Error importing metadata:', error);
    } finally {
        await pool.end();
    }
}

importMetadata(); 