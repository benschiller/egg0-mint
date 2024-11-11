const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants
const NEW_ADDRESSES_LOG = path.join(__dirname, 'newMintAddresses.log');
const NEW_INSCRIPTIONS_LOG = path.join(__dirname, 'newInscriptons.log');
const MEMPOOL_API_BASE = 'https://mempool.space/api';
const INSCRIPTION_CONTENT = 'OP_PUSHBYTES_75 2f636f6e74656e742f633330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930';

async function promptToContinue(address, inscriptions) {
    console.log(`\nFound inscriptions for address ${address}:`);
    inscriptions.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
    });

    // Wait 3 seconds then auto-continue
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('\nAuto-continuing after 3 second delay...');
    return true;
}

async function getNewInscriptions() {
    try {
        // Read addresses
        const data = fs.readFileSync(NEW_ADDRESSES_LOG, 'utf8');
        const addresses = data.split('\n').filter(line => line.trim());

        console.log(`Found ${addresses.length} addresses to process`);
        
        // Process each address
        for (const address of addresses) {
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
                        foundInscriptions.unshift(`${tx.txid}i0`);
                    }
                }
            });

            if (foundInscriptions.length > 0) {
                await promptToContinue(address, foundInscriptions);
                // Auto-continues after 3 seconds
                foundInscriptions.forEach(inscription => {
                    fs.appendFileSync(NEW_INSCRIPTIONS_LOG, `${inscription}\n`);
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
    getNewInscriptions()
        .then(() => {
            console.log('\nAll addresses processed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = getNewInscriptions;
