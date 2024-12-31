const WebSocket = require('ws');
const axios = require('axios');
const { Pool } = require('pg');
const config = require('../config');

// Constants
const ROYALTY_ADDRESS = config.ROYALTY_ADDRESS;
const PLATFORM_FEE_ADDRESS = 'bc1pndths0lnsvem2a0n2c6t49u462xam0n4krjl6kpfwn0nknc0cd7qmnxhf8';
const INSCRIPTION_CONTENT = 'OP_PUSHBYTES_75 2f636f6e74656e742f6330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930';
const IMAGE_URL = 'https://i.imgur.com/shyilcA.gif';
const MEMPOOL_API_BASE = 'https://mempool.space/api';

// Database connection using config
const pool = new Pool(config.DB_CONFIG);

// Add pending transactions map
const pendingTransactions = new Map();

// Helper functions
function isRoyaltyAmount(amount) {
    return amount % 40000 === 0;
}

async function processTransaction(tx) {
    try {
        // Get input addresses
        const inputAddresses = new Set();
        tx.vin.forEach(input => {
            if (input.prevout && input.prevout.scriptpubkey_address) {
                inputAddresses.add(input.prevout.scriptpubkey_address);
            }
        });

        // Find royalty output
        const royaltyOutput = tx.vout.find(out => 
            out.scriptpubkey_address === ROYALTY_ADDRESS && 
            isRoyaltyAmount(out.value)
        );

        if (!royaltyOutput) return null;

        // Find change address
        const changeOutput = tx.vout.find(out => 
            inputAddresses.has(out.scriptpubkey_address)
        );

        if (!changeOutput) return null;

        // Check for platform fee (batch royalty)
        const hasPlatformFee = tx.vout.some(out => 
            out.scriptpubkey_address === PLATFORM_FEE_ADDRESS
        );

        // Get potential inscription addresses
        const inscriptionAddresses = tx.vout
            .filter(out => 
                out.scriptpubkey_address !== ROYALTY_ADDRESS &&
                out.scriptpubkey_address !== PLATFORM_FEE_ADDRESS &&
                !inputAddresses.has(out.scriptpubkey_address)
            )
            .map(out => out.scriptpubkey_address);

        return {
            type: hasPlatformFee ? 'batch' : 'direct',
            addresses: inscriptionAddresses,
            hasInscription: tx.vin[0]?.inner_witnessscript_asm?.includes('OP_PUSHBYTES_75 2f636f6e74656e742f6330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930')
        };
    } catch (error) {
        console.error('Error processing transaction:', error);
        return null;
    }
}

async function getNextInscriptionNumber() {
    const result = await pool.query(`
        SELECT meta->>'name' as name 
        FROM inscriptions 
        ORDER BY (regexp_replace(meta->>'name', '\\D', '', 'g'))::integer DESC 
        LIMIT 1
    `);
    
    if (result.rows.length === 0) return 1;
    
    const lastNumber = parseInt(result.rows[0].name.replace(/\D/g, ''));
    return lastNumber + 1;
}

async function processInscriptionAddress(address) {
    try {
        log(`Fetching transactions for potential inscription address: ${address}`);
        const url = `${MEMPOOL_API_BASE}/address/${address}/txs`;
        const response = await axios.get(url);
        const transactions = response.data;
        
        log(`Found ${transactions.length} transactions for address`);
        const foundInscriptions = [];
        
        for (const tx of transactions) {
            if (tx.vin && tx.vin[0] && tx.vin[0].inner_witnessscript_asm) {
                const script = tx.vin[0].inner_witnessscript_asm;
                // Look for exact opcode and full hex within the script
                if (script.includes('OP_PUSHBYTES_75 2f636f6e74656e742f6330623464373435346430363538336437636632663935303665343334656363336232303464656264353738613738316564303739303931613731663633326930')) {
                    log(`Found inscription in transaction: ${tx.txid}`);
                    foundInscriptions.push(`${tx.txid}i0`);
                }
            }
        }
        
        log('Found inscriptions:', foundInscriptions);
        return foundInscriptions;
    } catch (error) {
        log('Error processing inscription address:', error);
        return [];
    }
}

async function updateDatabase(inscriptionIds) {
    try {
        for (const id of inscriptionIds) {
            log(`Processing inscription ID: ${id}`);

            // Check if inscription already exists
            const exists = await pool.query(
                'SELECT id FROM inscriptions WHERE id = $1',
                [id]
            );
            
            if (exists.rows.length > 0) {
                log(`Inscription ${id} already exists, skipping`);
                continue;
            }

            // Get fresh number before insert
            const nextNumber = await getNextInscriptionNumber();
            log(`Next inscription number: ${nextNumber}`);

            // Prepare the meta data
            const metaData = {
                name: `egg0 #${nextNumber}`,
                high_res_img_url: IMAGE_URL
            };
            log(`Meta data for inscription ${id}:`, metaData);

            // Construct the SQL query
            const queryText = 'INSERT INTO inscriptions (id, meta) VALUES ($1, $2)';
            const queryValues = [id, metaData];
            log(`Executing SQL query: ${queryText}`);
            log(`Query values:`, queryValues);

            // Execute the query
            await pool.query(queryText, queryValues);
            log(`Successfully inserted inscription ${id} as egg0 #${nextNumber}`);
        }
    } catch (error) {
        log('Error updating database:', error);
    }
}

// Add logging function
function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// Test database connection before starting WebSocket
pool.query('SELECT COUNT(*) FROM inscriptions')
    .then(result => {
        console.log('Database connected, current inscription count:', result.rows[0].count);
        startWebSocketConnection();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

// Move WebSocket setup into a function
function startWebSocketConnection() {
    const ws = new WebSocket('wss://mempool.space/api/v1/ws');

    ws.on('open', () => {
        log('WebSocket connected');
        const trackMsg = { 'track-address': ROYALTY_ADDRESS };
        log('Sending track message', trackMsg);
        ws.send(JSON.stringify(trackMsg));
    });

    ws.on('ping', () => {
        log('Received ping');
    });

    ws.on('pong', () => {
        log('Received pong');
    });

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            log('Raw message received:', data.toString());
            log('Parsed message:', message);
            
            if (message['address-transactions']) {
                log('Found address transactions');
                const tx = message['address-transactions'][0];
                log('Processing transaction:', tx.txid);
                
                // Check if this is a new transaction for an address we're tracking
                for (const [addr, pendingData] of pendingTransactions) {
                    if (pendingData.type === 'batch' && 
                        tx.vin[0]?.inner_witnessscript_asm?.includes('OP_PUSHBYTES_75 2f636f6e74656e742f')) {
                        log(`Found inscription in transaction: ${tx.txid}`);
                        pendingData.inscriptionTxid = tx.txid;
                        log(`Updated inscriptionTxid for address ${addr}`);
                    }
                }
                
                const result = await processTransaction(tx);
                if (result) {
                    log(`Found ${result.type} royalty transaction`);
                    log('Storing addresses for confirmation:', result.addresses);
                    
                    // Store addresses with transaction and type
                    result.addresses.forEach(addr => {
                        pendingTransactions.set(addr, {
                            tx: tx,
                            type: result.type,
                            inscriptionTxid: result.hasInscription ? tx.txid : null
                        });
                    });
                }
            }

            if (message['block-transactions']) {
                const tx = message['block-transactions'][0];
                if (tx.status.confirmed) {
                    log('Processing confirmed transaction:', tx.txid);
                    
                    for (const [addr, pendingData] of pendingTransactions) {
                        if (pendingData.inscriptionTxid === tx.txid) {
                            // We found a confirmed inscription transaction
                            const inscriptionId = `${tx.txid}i0`;
                            log(`Found confirmed inscription: ${inscriptionId}`);
                            await updateDatabase([inscriptionId]);
                            pendingTransactions.delete(addr);
                            log(`Removed address ${addr} after writing inscription`);
                        }
                    }
                }
            }
        } catch (error) {
            log('Error processing message:', error);
        }
    });

    ws.on('error', (error) => {
        log('WebSocket error', error);
        if (error.code === 'ECONNRESET') {
            log('Connection reset by peer detected');
        }
    });

    ws.on('close', () => {
        log('WebSocket connection closed');
        clearInterval(heartbeat);
        // Reconnect after a delay
        setTimeout(() => {
            log('Attempting to reconnect WebSocket...');
            startWebSocketConnection();
        }, 5000);  // Reconnect after 5 seconds
    });

    // Add heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 60000);  // Increase to 60 seconds

    return ws;
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    pool.end().then(() => process.exit(0));
});