import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',

    laravel: {
        apiUrl: process.env.LARAVEL_API_URL || 'http://localhost:8000',
        timeout: parseInt(process.env.LARAVEL_API_TIMEOUT || '5000', 10),
    },

    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
    },

    socket: {
        corsOrigin: (process.env.SOCKET_CORS_ORIGIN || '').split(',').filter(Boolean),
        pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || './logs',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};
