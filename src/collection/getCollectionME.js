const axios = require('axios');
require('dotenv').config();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getCollectionMEWithRetry(collectionSymbol, maxAttempts = 30, delayMs = 2000) {
    const startTime = Date.now();
    const timeoutMs = 60000; // 60 seconds timeout
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            // Check if we've exceeded timeout
            if (Date.now() - startTime >= timeoutMs) {
                throw new Error('Operation timed out after 60 seconds');
            }

            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts}...`);

            const response = await axios.get(
                `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/${collectionSymbol}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.MAGICEDEN_API_KEY}`,
                        'Accept': 'application/json'
                    }
                }
            );
            return response.data;

        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log(`Rate limited. Retrying in ${delayMs/1000} seconds...`);
                await delay(delayMs);
                continue;
            }

            if (error.response) {
                console.error('Error response:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error:', error.message);
            }

            // If we're not rate limited, or it's a timeout error, throw immediately
            if (error.message === 'Operation timed out after 60 seconds' || 
                (error.response && error.response.status !== 429)) {
                throw error;
            }

            // For other errors, retry after delay
            await delay(delayMs);
        }
    }

    throw new Error(`Failed after ${maxAttempts} attempts`);
}

// Allow command line execution
if (require.main === module) {
    const collectionSymbol = process.argv[2];
    
    if (!collectionSymbol) {
        console.error('Please provide a collection symbol');
        console.log('Usage: node getCollectionME.js <collectionSymbol>');
        process.exit(1);
    }

    getCollectionMEWithRetry(collectionSymbol)
        .then(data => {
            console.log(JSON.stringify(data, null, 2));
        })
        .catch((error) => {
            console.error('Final error:', error.message);
            process.exit(1);
        });
}

module.exports = getCollectionMEWithRetry;