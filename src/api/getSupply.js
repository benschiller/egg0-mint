const { Pool } = require('pg');

const pool = new Pool({
    user: 'valerian',
    host: 'localhost',
    database: 'egg0_db',
    port: 5433
});

async function getSupply() {
    try {
        const result = await pool.query('SELECT total FROM supply_count');
        return result.rows[0].total;
    } catch (error) {
        console.error('Error fetching supply:', error);
        throw error;
    }
}

module.exports = getSupply; 