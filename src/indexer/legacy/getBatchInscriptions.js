const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants
const POTENTIAL_LOG = path.join(__dirname, 'potentialInscriptions.log');
const BATCH_LOG = path.join(__dirname, 'batchInscriptions.log');
const MEMPOOL_API_BASE = 'https://mempool.space/api';
const INSCRIPTION_CONTENT = 'OP_PUSHBYTES_75 2f636f6e74656e742f633330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930';

async function promptToContinue(address, inscriptions) {
    console.log(`\nFound inscriptions for address ${address}:`);
    inscriptions.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
    });

    // Wait 1 second then auto-continue
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('\nAuto-continuing after 1 second delay...');
    return true;
}

async function getBatchInscriptions() {
    try {
        // Read and filter batch addresses
        const data = fs.readFileSync(POTENTIAL_LOG, 'utf8');
        const batchAddresses = data
            .split('\n')
            .filter(line => line.includes(',batch'))
            .map(line => line.split(',')[0]);

        console.log(`Found ${batchAddresses.length} batch addresses to process`);
        
        // Process each address
        for (const address of batchAddresses) {
            console.log(`\nProcessing address: ${address}`);
            
            // Fetch transactions
            const url = `${MEMPOOL_API_BASE}/address/${address}/txs`;
            console.log('Fetching from:', url);
            
            const response = await axios.get(url);
            const transactions = response.data;

            // Find inscriptions
            const foundInscriptions = [];
            
            transactions.forEach(tx => {
                if (tx.vin && tx.vin[0] && tx.vin[0].inner_witnessscript_asm) {
                    if (tx.vin[0].inner_witnessscript_asm.includes(INSCRIPTION_CONTENT)) {
                        foundInscriptions.push(`${tx.txid}i0`);
                    }
                }
            });

            if (foundInscriptions.length > 0) {
                await promptToContinue(address, foundInscriptions);
                // Auto-continues after 1 second
                foundInscriptions.forEach(inscription => {
                    fs.appendFileSync(BATCH_LOG, `${inscription}\n`);
                });
                console.log('Inscriptions logged successfully');
            } else {
                console.log('No inscriptions found');
            }
        }

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

if (require.main === module) {
    getBatchInscriptions()
        .then(() => {
            console.log('\nAll batch addresses processed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = getBatchInscriptions;
