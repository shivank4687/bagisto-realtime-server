import Redis from 'ioredis';
import { config } from '@config/index';
import logger from './logger.service';

class RedisService {
    private client: Redis | null = null;
    private subscriber: Redis | null = null;
    private publisher: Redis | null = null;
    private enabled: boolean;

    constructor() {
        this.enabled = config.redis.enabled;

        if (this.enabled) {
            this.initialize();
        } else {
            logger.info('Redis is disabled - using in-memory fallback');
        }
    }

    private initialize() {
        const redisConfig = {
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        };

        try {
            this.client = new Redis(redisConfig);
            this.subscriber = new Redis(redisConfig);
            this.publisher = new Redis(redisConfig);

            this.setupEventHandlers();
            logger.info('Redis initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
            logger.warn('Falling back to in-memory mode');
            this.enabled = false;
            this.client = null;
            this.subscriber = null;
            this.publisher = null;
        }
    }

    private setupEventHandlers() {
        if (!this.client) return;

        this.client.on('connect', () => {
            logger.info('Redis client connected');
        });

        this.client.on('error', (error) => {
            logger.error('Redis client error:', error);
        });

        this.client.on('close', () => {
            logger.warn('Redis connection closed');
        });

        if (this.subscriber) {
            this.subscriber.on('connect', () => {
                logger.info('Redis subscriber connected');
            });
        }

        if (this.publisher) {
            this.publisher.on('connect', () => {
                logger.info('Redis publisher connected');
            });
        }
    }

    isEnabled(): boolean {
        return this.enabled && this.client !== null;
    }

    getClient(): Redis | null {
        return this.client;
    }

    getSubscriber(): Redis | null {
        return this.subscriber;
    }

    getPublisher(): Redis | null {
        return this.publisher;
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!this.isEnabled() || !this.client) {
            logger.debug('Redis not available, skipping set operation');
            return;
        }

        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
        } catch (error) {
            logger.error('Redis set error:', error);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isEnabled() || !this.client) {
            logger.debug('Redis not available, returning null');
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.isEnabled() || !this.client) {
            return;
        }

        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Redis delete error:', error);
        }
    }

    async publish(channel: string, message: any): Promise<void> {
        if (!this.isEnabled() || !this.publisher) {
            logger.debug('Redis pub/sub not available, skipping publish');
            return;
        }

        try {
            await this.publisher.publish(channel, JSON.stringify(message));
        } catch (error) {
            logger.error('Redis publish error:', error);
        }
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        if (!this.isEnabled() || !this.subscriber) {
            logger.debug('Redis pub/sub not available, skipping subscribe');
            return;
        }

        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (ch, msg) => {
                if (ch === channel) {
                    try {
                        callback(JSON.parse(msg));
                    } catch (error) {
                        logger.error('Error parsing Redis message:', error);
                    }
                }
            });
        } catch (error) {
            logger.error('Redis subscribe error:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            if (this.client) await this.client.quit();
            if (this.subscriber) await this.subscriber.quit();
            if (this.publisher) await this.publisher.quit();
            logger.info('Redis disconnected');
        } catch (error) {
            logger.error('Error disconnecting Redis:', error);
        }
    }
}

export default new RedisService();
