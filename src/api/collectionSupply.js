const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/collection-supply', async (req, res) => {
    try {
        const response = await axios.get('https://api.bestinslot.xyz/v3/collection/info', {
            headers: {
                'x-api-key': process.env.REACT_APP_BIS_API_KEY
            },
            params: {
                slug: 'egg0'
            }
        });

        const supply = parseInt(response.data.data.supply, 10);
        res.json({ supply });
    } catch (error) {
        console.error('Detailed error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: 'Failed to fetch collection supply',
            details: error.response ? error.response.data : error.message 
        });
    }
});

module.exports = router; 