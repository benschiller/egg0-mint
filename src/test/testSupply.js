const getSupply = require('./api/getSupply');
async function test() {
    const count = await getSupply();
    console.log('Supply count:', count);
}
test();