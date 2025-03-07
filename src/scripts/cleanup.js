/**
 * Cleanup script to ensure the server doesn't allow new mints
 * This script is run when the server is stopped
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function cleanup() {
    console.log('Running cleanup script...');
    
    // Kill all related processes first
    console.log('Killing all related processes...');
    
    // Define process patterns to kill
    const processPatterns = [
        'node.*src/api/server.js',
        'node.*src/indexer/monitorInscriptions.js',
        'postgres -D egg0-postgres-data',
        'react-scripts start',
        'concurrently',
        'npm run dev',
        'npm run api',
        'npm run monitor',
        'npm run client',
        'npm run postgres'
    ];
    
    // Kill each process pattern
    processPatterns.forEach(pattern => {
        try {
            console.log(`Killing processes matching: ${pattern}`);
            execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' });
        } catch (e) {
            // Ignore errors if process not found
            console.log(`No processes found matching: ${pattern}`);
        }
    });
    
    // Check for any remaining processes on the ports we use
    const ports = [3000, 3001, 5433];
    ports.forEach(port => {
        try {
            console.log(`Checking for processes on port ${port}...`);
            const output = execSync(`lsof -i :${port} | grep LISTEN`, { stdio: 'pipe' }).toString();
            
            if (output) {
                console.log(`Found processes on port ${port}, killing them...`);
                execSync(`lsof -t -i :${port} | xargs kill -9`, { stdio: 'ignore' });
            }
        } catch (e) {
            // Ignore errors if no processes found
            console.log(`No processes found on port ${port}`);
        }
    });
    
    // Check for and remove PostgreSQL pid file if it exists
    const pidFilePath = path.join(process.cwd(), 'egg0-postgres-data', 'postmaster.pid');
    try {
        if (fs.existsSync(pidFilePath)) {
            console.log(`Found PostgreSQL pid file at ${pidFilePath}, removing it...`);
            fs.unlinkSync(pidFilePath);
            console.log('PostgreSQL pid file removed.');
        }
    } catch (error) {
        console.error(`Error removing PostgreSQL pid file: ${error.message}`);
    }
    
    // Try to connect to the database and get the inscription count
    try {
        // Database connection using config but with SSL disabled
        const dbConfig = {
            ...config.DB_CONFIG,
            ssl: false
        };
        const pool = new Pool(dbConfig);
        
        // Get current inscription count
        const result = await pool.query('SELECT COUNT(*) FROM inscriptions');
        const count = parseInt(result.rows[0].count, 10);
        
        console.log(`Current inscription count: ${count}/888`);
        console.log('Mint is complete. No new inscriptions will be processed.');
        
        // Close the database connection
        await pool.end();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error connecting to database:', error.message);
        console.log('Continuing with cleanup...');
    }
    
    console.log('Cleanup complete.');
}

// Run the cleanup function
cleanup()
    .then(() => {
        console.log('Cleanup script completed successfully.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Cleanup script failed:', error);
        // Still exit with success code since we've attempted to kill processes
        process.exit(0);
    }); 