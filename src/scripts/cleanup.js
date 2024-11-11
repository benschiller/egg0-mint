const { execSync } = require('child_process');

function cleanup() {
    try {
        console.log('Starting cleanup...');

        // Kill our specific processes
        const processPatterns = [
            'postgres -D egg0-postgres-data',
            'node.*egg0-mint',
            'react-scripts start',
            'node.*server.js',
            'concurrently',
            'npm run'
        ];

        processPatterns.forEach(pattern => {
            try {
                console.log(`Killing processes matching: ${pattern}`);
                execSync(`pkill -f "${pattern}"`);
            } catch (e) {
                // Ignore errors if process not found
            }
        });

        // Force kill any remaining egg0-mint processes
        try {
            execSync('pkill -9 -f "egg0-mint"');
        } catch (e) {
            // Ignore errors if process not found
        }

        // Clean up ports
        [3000, 3001, 5433].forEach(port => {
            try {
                console.log(`Checking port ${port}...`);
                const processes = execSync(`lsof -i :${port}`).toString();
                if (processes) {
                    console.log(`Killing processes on port ${port}`);
                    execSync(`lsof -t -i :${port} | xargs kill -9`);
                }
            } catch (e) {
                // Ignore errors if no processes found
            }
        });

        console.log('Cleanup complete');
    } catch (error) {
        console.log('Error during cleanup:', error.message);
    }
}

if (require.main === module) {
    cleanup();
}

module.exports = cleanup; 