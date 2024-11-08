const axios = require('axios');
require('dotenv').config();

async function getInscriptionsPerTrxn(txId) {
    try {
        const response = await axios.get(
            `https://api.bestinslot.xyz/v3/inscription/in_transaction`,
            {
                params: {
                    tx_id: txId
                },
                headers: {
                    'X-API-KEY': process.env.BIS_API_KEY,
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

// Allow command line execution
if (require.main === module) {
    const txId = process.argv[2];
    
    if (!txId) {
        console.error('Please provide a transaction ID');
        console.log('Usage: node getInscriptionsPerTrxn.js <tx_id>');
        process.exit(1);
    }

    getInscriptionsPerTrxn(txId)
        .then(data => {
            console.log(JSON.stringify(data, null, 2));
        })
        .catch(() => {
            process.exit(1);
        });
}

module.exports = getInscriptionsPerTrxn;
