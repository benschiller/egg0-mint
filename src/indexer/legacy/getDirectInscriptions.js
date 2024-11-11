const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Constants
const POTENTIAL_LOG = path.join(__dirname, 'potentialInscriptions.log');
const DIRECT_LOG = path.join(__dirname, 'directInscriptions.log');
const MEMPOOL_API_BASE = 'https://mempool.space/api';
const INSCRIPTION_CONTENT = 'OP_PUSHBYTES_75 2f636f6e74656e742f633330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930';

async function promptToContinue(address, inscriptions) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`\nFound inscriptions for address ${address}:`);
    inscriptions.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
    });

    return new Promise(resolve => {
        rl.question('\nLog these inscriptions and continue to next address? (y/n): ', answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function getDirectInscriptions() {
    try {
        // Read and filter direct addresses
        const data = fs.readFileSync(POTENTIAL_LOG, 'utf8');
        const directAddresses = data
            .split('\n')
            .filter(line => line.includes(',direct'))
            .map(line => line.split(',')[0]);

        console.log(`Found ${directAddresses.length} direct addresses to process`);
        
        // Process each address
        for (const address of directAddresses) {
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
                const shouldContinue = await promptToContinue(address, foundInscriptions);
                if (shouldContinue) {
                    // Log inscriptions
                    foundInscriptions.forEach(inscription => {
                        fs.appendFileSync(DIRECT_LOG, `${inscription}\n`);
                    });
                    console.log('Inscriptions logged successfully');
                } else {
                    console.log('Process stopped by user');
                    break;
                }
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
    getDirectInscriptions()
        .then(() => {
            console.log('\nAll direct addresses processed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = getDirectInscriptions;
