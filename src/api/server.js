const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const config = require('../config');

const app = express();
app.use(cors());

// Use database config from config.js
const pool = new Pool(config.DB_CONFIG);

app.get('/api/supply', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM inscriptions');
        res.json({ total: result.rows[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 