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

// MINT IS COMPLETE - No new inscriptions will be processed
console.log('MINT COMPLETE: Indexer is running in read-only mode. No new inscriptions will be processed.');

// Helper functions for querying existing data
async function getInscriptionCount() {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM inscriptions');
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('Error getting inscription count:', error);
        return 0;
    }
}

// Log the current state
async function logCurrentState() {
    try {
        const count = await getInscriptionCount();
        console.log(`Current inscription count: ${count}/888`);
        console.log('Mint is complete. No new inscriptions will be processed.');
        
        // Schedule the next log
        setTimeout(logCurrentState, 60 * 60 * 1000); // Log once per hour
    } catch (error) {
        console.error('Error logging current state:', error);
    }
}

// Start the monitoring process
async function start() {
    try {
        // Log the current state
        await logCurrentState();
    } catch (error) {
        console.error('Error starting monitoring process:', error);
    }
}

// Start the process
start();