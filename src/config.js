require('dotenv').config();

module.exports = {
    BIS_API_BASE_URL: 'https://api.bestinslot.xyz/v3',
    COLLECTION_SLUG: 'egg0',
    ROYALTY_ADDRESS: 'bc1pppsq0wf6hpgd9j9fzc5xzzzhundw54ra038hdaae2hrmnu2zyrgqpwzvwd',

    // Rate Limits
    RATE_LIMITS: {
        bis: {
            maxRequests: 5,
            timeWindowMs: 1000
        },
        default: {
            maxRequests: 5,
            timeWindowMs: 1000
        }
    },

    // Token Addresses
    SOL_TOKEN: 'So11111111111111111111111111111111111111112',
    USDC_TOKEN: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',

    // Database config
    DB_CONFIG: process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        user: 'valerian',
        host: 'localhost',
        database: 'egg0_db',
        port: 5433
    }
};
