import redis from "../config/redis.js";

/** 
    *sliding window rate limiter
    
 */

const rateLimiter = (limit, windowInSeconds) => {
    return async (req, res, next) => {
        try {
            //identify user (fallback to Ip if not authenticated)
            const userId = req.user?.id || req.ip;

            const endpoint = req.baseUrl + req.path;

            //unique key per user per endpoint
            const key = `ratelimit:${userId}:${endpoint}`;

            const now = Date.now();
            const windowStart = now - windowInSeconds * 1000;

            // remove old timestamps
            await redis.zremrangebyscore(key, 0, windowStart);

            // count current requests
            const requestCount = await redis.zcard(key);

            if (requestCount >= limit) {
                return res.status(429).json({
                    message: "Too many requests. Please try again later",
                });
            }

            // add current request timestamp
            await redis.add(key, now, now.toString());

            //set expiration to avoid memory leaks
            await redis.expire(key, windowInSeconds)

            next();
        } catch (error) {
            console.error("Rate limiter error:", error);

            // Fail open (do not block if Redis fails)
            next();
        }
    }
}

export default rateLimiter;