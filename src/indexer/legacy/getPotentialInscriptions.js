const fs = require('fs');

// Constants
const ROYALTY_ADDRESS = 'bc1pppsq0wf6hpgd9j9fzc5xzzzhundw54ra038hdaae2hrmnu2zyrgqpwzvwd';
const PLATFORM_FEE_ADDRESS = 'bc1pndths0lnsvem2a0n2c6t49u462xam0n4krjl6kpfwn0nknc0cd7qmnxhf8';
const ROYALTY_AMOUNT = 40000;

// Read the clean data file
const data = JSON.parse(fs.readFileSync('./src/indexer/royaltyAddress.clean.json', 'utf8'));

// Helper function to get input addresses from vin array
function getInputAddresses(vin) {
    const addresses = new Set();
    vin.forEach(input => {
        if (input.prevout && input.prevout.scriptpubkey_address) {
            addresses.add(input.prevout.scriptpubkey_address);
        }
    });
    return addresses;
}

// Process each transaction
data.forEach(tx => {
    const inputAddresses = getInputAddresses(tx.vin);
    const vout = tx.vout;

    // Check if royalty payment exists and is valid
    const royaltyOutput = vout.find(out => out.scriptpubkey_address === ROYALTY_ADDRESS);
    if (!royaltyOutput || royaltyOutput.value % ROYALTY_AMOUNT !== 0) {
        return;
    }

    // Find change address (must match an input address)
    const changeOutput = vout.find(out => inputAddresses.has(out.scriptpubkey_address));
    if (!changeOutput) {
        return;
    }

    // Check for platform fee address (batch royalty)
    const hasPlatformFee = vout.some(out => out.scriptpubkey_address === PLATFORM_FEE_ADDRESS);

    // Get remaining addresses (excluding known ones)
    const remainingOutputs = vout.filter(out => 
        out.scriptpubkey_address !== ROYALTY_ADDRESS &&
        out.scriptpubkey_address !== PLATFORM_FEE_ADDRESS &&
        !inputAddresses.has(out.scriptpubkey_address)
    );

    // Determine type and log addresses
    if (hasPlatformFee && remainingOutputs.length >= 1) {
        // Batch royalty
        remainingOutputs.forEach(output => {
            fs.appendFileSync(
                './src/indexer/potentialInscriptions.log',
                `${output.scriptpubkey_address},batch\n`
            );
        });
    } else if (!hasPlatformFee && remainingOutputs.length === 1) {
        // Direct royalty
        fs.appendFileSync(
            './src/indexer/potentialInscriptions.log',
            `${remainingOutputs[0].scriptpubkey_address},direct\n`
        );
    }
});

console.log('Potential inscriptions have been logged to potentialInscriptions.log');
