const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'royaltyAddress.log');
const CLEAN_FILE = path.join(__dirname, 'royaltyAddress.clean.json');

// Read the log file
const logContent = fs.readFileSync(LOG_FILE, 'utf8');

// Split into entries by the separator
const entries = logContent.split('---\n');

// Extract and combine all transactions
const allTransactions = entries
    .map(entry => {
        try {
            const parsed = JSON.parse(entry.trim());
            return parsed.data;
        } catch (e) {
            return [];
        }
    })
    .flat();

// Write clean JSON file
fs.writeFileSync(CLEAN_FILE, JSON.stringify(allTransactions, null, 2)); 