import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || '';

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis =
    globalForRedis.redis ??
    (redisUrl === 'localhost' && process.env.NODE_ENV === 'production'
        ? new Redis({ lazyConnect: true }) // Mock/Lazy for build
        : new Redis({
            host: redisUrl,
            port: redisPort,
            password: redisPassword || undefined,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    return null;
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            lazyConnect: true, // Don't connect immediately
        }));

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('error', (err) => {
    console.error('Redis Client Error', err);
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

// Helper functions for cache management
export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error(`Error getting cached data for key ${key}:`, error);
        return null;
    }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
}

export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
    }
}
