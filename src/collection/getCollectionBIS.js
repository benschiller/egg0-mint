require('dotenv').config();
const axios = require('axios');
const { BIS_API_BASE_URL, COLLECTION_SLUG } = require('../config');

async function getCollectionInfo() {
    const apiKey = process.env.BIS_API_KEY;
    const baseUrl = `${BIS_API_BASE_URL}/collection/info`;

    try {
        const response = await axios.get(baseUrl, {
            headers: {
                'x-api-key': apiKey
            },
            params: {
                slug: COLLECTION_SLUG
            }
        });

        const collectionData = response.data.data;
        return parseInt(collectionData.supply, 10);
    } catch (error) {
        if (error.response) {
            console.error('API Response:', error.response.data);
            console.error(`HTTP error! status: ${error.response.status}`);
        } else {
            console.error('Error fetching collection information:', error.message);
        }
    }
}

// Command-line execution
if (require.main === module) {
    getCollectionInfo()
        .then(supply => {
            console.log(`Current supply: ${supply}`);
        })
        .catch(error => {
            console.error("Error fetching collection information:", error);
        });
}

// Export the function for use in other files
module.exports = getCollectionInfo;
