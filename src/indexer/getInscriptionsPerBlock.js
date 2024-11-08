const fs = require('fs');
const path = require('path');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getInscriptions(blockId) {
    const baseUrl = 'https://api.hiro.so/ordinals/v1/inscriptions';
    let allInscriptions = [];
    let offset = 0;
    const limit = 60;
    let hasMore = true;

    console.log('Starting to fetch inscriptions...');
    
    // Create/clear the log file
    const logPath = path.join(__dirname, 'inscriptions.log');
    fs.writeFileSync(logPath, '[\n', 'utf8');

    while (hasMore) {
        try {
            console.log(`Fetching inscriptions ${offset} to ${offset + limit}...`);
            const response = await fetch(`${baseUrl}?genesis_block=${blockId}&limit=${limit}&offset=${offset}`);
            
            if (!response.ok) {
                const text = await response.text();
                console.error('API Response:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.results && data.results.length > 0) {
                // Append to file, with proper JSON formatting
                const inscriptions = data.results;
                inscriptions.forEach((inscription, index) => {
                    // Add comma after each item except the last one (which we don't know yet)
                    fs.appendFileSync(logPath, JSON.stringify(inscription, null, 2) + ',\n');
                });

                console.log(`Fetched ${inscriptions.length} inscriptions. Total so far: ${allInscriptions.length + inscriptions.length}`);
                allInscriptions = allInscriptions.concat(inscriptions);
                
                // If we got less than the limit, we're done
                if (inscriptions.length < limit) {
                    hasMore = false;
                } else {
                    offset += limit;
                    await delay(1000); // Be nice to the API
                }
            } else {
                console.log('No more inscriptions to fetch.');
                hasMore = false;
            }
        } catch (error) {
            console.error('Error fetching inscriptions:', error);
            throw error;
        }
    }

    // Remove the last comma and close the JSON array
    const logContent = fs.readFileSync(logPath, 'utf8').slice(0, -2) + '\n]';
    fs.writeFileSync(logPath, logContent);
    
    return allInscriptions;
}

// Command-line execution
const blockId = process.argv[2]; // Get block ID from command line argument

if (!blockId) {
    console.error("Please provide a block ID as an argument.");
    process.exit(1);
}

getInscriptions(blockId)
    .then(inscriptions => {
        console.log(`\nFetch complete. Total inscriptions found: ${inscriptions.length}`);
        console.log(`Results written to: ${path.join(__dirname, 'inscriptions.log')}`);
    })
    .catch(error => {
        console.error("Error fetching inscriptions:", error);
    });