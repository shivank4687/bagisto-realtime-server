import redisService from './redis.service';
import logger from './logger.service';

interface CacheItem<T> {
    value: T;
    expiresAt?: number;
}

class CacheService {
    private memoryCache: Map<string, CacheItem<any>>;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.memoryCache = new Map();

        // Cleanup expired items every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        // Try Redis first
        if (redisService.isEnabled()) {
            await redisService.set(key, value, ttl);
            return;
        }

        // Fallback to memory
        const item: CacheItem<T> = {
            value,
            expiresAt: ttl ? Date.now() + (ttl * 1000) : undefined,
        };

        this.memoryCache.set(key, item);
        logger.debug(`Cached in memory: ${key}`);
    }

    async get<T>(key: string): Promise<T | null> {
        // Try Redis first
        if (redisService.isEnabled()) {
            return await redisService.get<T>(key);
        }

        // Fallback to memory
        const item = this.memoryCache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }

        return item.value as T;
    }

    async delete(key: string): Promise<void> {
        // Try Redis first
        if (redisService.isEnabled()) {
            await redisService.delete(key);
            return;
        }

        // Fallback to memory
        this.memoryCache.delete(key);
    }

    async clear(): Promise<void> {
        this.memoryCache.clear();
        logger.info('Memory cache cleared');
    }

    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, item] of this.memoryCache.entries()) {
            if (item.expiresAt && now > item.expiresAt) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Cleaned ${cleaned} expired items from memory cache`);
        }
    }

    getStats() {
        return {
            size: this.memoryCache.size,
            redisEnabled: redisService.isEnabled(),
        };
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.memoryCache.clear();
    }
}

export default new CacheService();
