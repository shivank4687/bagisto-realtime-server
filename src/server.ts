import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from '@config/index';
import logger from '@services/logger.service';
import redisService from '@services/redis.service';
import cacheService from '@services/cache.service';
import { authMiddleware } from '@middleware/auth.middleware';
import { errorMiddleware } from '@middleware/error.middleware';
import { AuthenticatedSocket } from 'types/socket.types';

// Import modules
import { initializeRFQModule } from '@modules/rfq';
import { initializeNotificationModule } from '@modules/notifications';
import { initializeOrderModule } from '@modules/orders';

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval,
});

// Apply middleware
io.use(authMiddleware);
io.use(errorMiddleware);

// Handle connections
io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.data.user.name} (${socket.id})`);

    // Initialize modules
    initializeRFQModule(io, socket);
    initializeNotificationModule(io, socket);
    initializeOrderModule(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.data.user.name} - ${reason}`);
    });
});

// Setup Redis pub/sub ONLY if Redis is enabled
if (redisService.isEnabled()) {
    logger.info('Setting up Redis pub/sub for multi-server support');

    const subscriber = redisService.getSubscriber();

    if (subscriber) {
        subscriber.on('message', (channel, message) => {
            try {
                const data = JSON.parse(message);

                // Broadcast to appropriate room
                if (channel.startsWith('message:')) {
                    const roomName = channel.replace('message:', '');
                    io.to(roomName).emit('rfq:new-message', data);
                }
            } catch (error) {
                logger.error('Error processing Redis message:', error);
            }
        });

        // Subscribe to message channels
        subscriber.psubscribe('message:*');
    }
} else {
    logger.warn('Redis pub/sub disabled - running in single-server mode');
    logger.warn('For multi-server deployments, enable Redis in .env');
}

// Start server
server.listen(config.port, config.host, () => {
    logger.info(`╔═══════════════════════════════════════════════════════════╗`);
    logger.info(`║  Bagisto Real-Time Server                                ║`);
    logger.info(`╠═══════════════════════════════════════════════════════════╣`);
    logger.info(`║  Server:      http://${config.host}:${config.port.toString().padEnd(32)} ║`);
    logger.info(`║  Environment: ${config.env.padEnd(42)} ║`);
    logger.info(`║  Redis:       ${(redisService.isEnabled() ? 'Enabled ✓' : 'Disabled (in-memory)').padEnd(42)} ║`);
    logger.info(`╚═══════════════════════════════════════════════════════════╝`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);

    io.close(() => {
        logger.info('Socket.IO server closed');
    });

    server.close(() => {
        logger.info('HTTP server closed');
    });

    if (redisService.isEnabled()) {
        await redisService.disconnect();
    }

    cacheService.destroy();

    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
