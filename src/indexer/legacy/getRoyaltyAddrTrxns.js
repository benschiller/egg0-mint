const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('../../config');

const LOG_FILE = path.join(__dirname, 'royaltyAddress.log');
const MEMPOOL_API_BASE = 'https://mempool.space/api';

async function promptToContinue() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question('Continue to next page? (y/n): ', answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function getRoyaltyTransactions(afterTxid = '0') {
    try {
        const url = `${MEMPOOL_API_BASE}/address/${config.ROYALTY_ADDRESS}/txs?after_txid=${afterTxid}`;
        console.log('\nFetching transactions from:', url);

        const response = await axios.get(url);
        const transactions = response.data;

        // Write raw response to log
        fs.appendFileSync(LOG_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            after_txid: afterTxid,
            data: transactions
        }, null, 2) + '\n---\n');

        if (transactions.length > 0) {
            const lastTxid = transactions[transactions.length - 1].txid;
            console.log('\nLast transaction ID:', lastTxid);
            console.log('\nNext query URL:');
            console.log(`${MEMPOOL_API_BASE}/address/${config.ROYALTY_ADDRESS}/txs?after_txid=${lastTxid}`);
            
            const shouldContinue = await promptToContinue();
            if (shouldContinue) {
                await getRoyaltyTransactions(lastTxid);
            }
        } else {
            console.log('\nNo more transactions found.');
        }

    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
}

if (require.main === module) {
    getRoyaltyTransactions()
        .then(() => {
            console.log('\nTransaction data written to', LOG_FILE);
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = getRoyaltyTransactions;
