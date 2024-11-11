const { execSync } = require('child_process');

function checkPort(port) {
    try {
        const result = execSync(`lsof -i :${port}`).toString();
        console.log(`\nPort ${port}:`);
        console.log(result);
    } catch (e) {
        console.log(`\nPort ${port}: Nothing running`);
    }
}

console.log('Checking running processes...\n');
checkPort(5433);  // PostgreSQL
checkPort(3001);  // API Server
checkPort(3000);  // React Server

console.log('\nChecking for project processes:');
console.log(execSync('ps aux | grep -E "egg0|node|postgres"').toString()); 