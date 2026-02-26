// Token Blacklist — in-memory store for invalidated JWT tokens
//
// How it works:
//   On logout, the token's jti (or raw token) is stored here with its expiry time.
//   The protect middleware checks this list before allowing access.
//   Expired entries are pruned automatically so memory doesn't grow unbounded.
//
// Production note:
//   For multi-instance deployments (e.g. multiple Node processes / containers),
//   swap this with a Redis SET using the token's remaining TTL:
//     await redis.set(`bl:${token}`, '1', 'EX', secondsUntilExpiry);
//     await redis.exists(`bl:${token}`);

const blacklist = new Map(); // token -> expiry timestamp (ms)

// Prune tokens that have already expired — called on every add to keep memory clean
const pruneExpired = () => {
    const now = Date.now();
    for (const [token, expiry] of blacklist) {
        if (expiry <= now) blacklist.delete(token);
    }
};

/**
 * Add a token to the blacklist until it naturally expires
 * @param {string} token - Raw JWT string
 * @param {number} expiryTimestamp - Unix timestamp in seconds (from JWT exp claim)
 */
export const blacklistToken = (token, expiryTimestamp) => {
    pruneExpired();
    blacklist.set(token, expiryTimestamp * 1000); // convert JWT exp (seconds) to ms
};

/**
 * Check if a token has been blacklisted
 * @param {string} token - Raw JWT string
 * @returns {boolean}
 */
export const isBlacklisted = (token) => {
    const expiry = blacklist.get(token);
    if (!expiry) return false;
    // If it's somehow still in the map but expired, treat as not blacklisted and clean up
    if (expiry <= Date.now()) {
        blacklist.delete(token);
        return false;
    }
    return true;
};