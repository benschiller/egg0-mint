const config = require('../config');

class GlobalRateLimiter {
    constructor() {
        this.limiters = new Map();
    }

    async waitForToken(service = 'default') {
        const limiter = this.getLimiter(service);
        await limiter.waitForToken();
    }

    getLimiter(service) {
        if (!this.limiters.has(service)) {
            const limits = config.RATE_LIMITS[service] || config.RATE_LIMITS.default;
            this.limiters.set(service, new RateLimiter(limits.maxRequests));
        }
        return this.limiters.get(service);
    }
}

class RateLimiter {
    constructor(requestsPerSecond) {
        this.requestsPerSecond = requestsPerSecond;
        this.tokens = requestsPerSecond;
        this.lastRefill = Date.now();
    }

    async waitForToken() {
        this.refillTokens();
        
        if (this.tokens <= 0) {
            const waitTime = Math.ceil(1000 / this.requestsPerSecond);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.refillTokens();
        }
        
        this.tokens--;
    }

    refillTokens() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const refillAmount = (timePassed / 1000) * this.requestsPerSecond;
        
        this.tokens = Math.min(this.requestsPerSecond, this.tokens + refillAmount);
        this.lastRefill = now;
    }
}

module.exports = new GlobalRateLimiter(); 