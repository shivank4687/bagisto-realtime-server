import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '@config/index';
import cacheService from '@services/cache.service';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.socket.corsOrigin,
    credentials: true,
}));

// Compression
app.use(compression());

// Logging
if (config.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cache: cacheService.getStats(),
    });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.json({
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
    });
});

// Socket.IO emit endpoint (for Laravel backend to trigger events)
let socketIO: any = null;
export const setSocketIO = (io: any) => {
    socketIO = io;
};

app.post('/api/emit', (req, res) => {
    try {
        const { room, event, data } = req.body;

        if (!socketIO) {
            return res.status(503).json({ error: 'Socket.IO not initialized' });
        }

        if (!room || !event) {
            return res.status(400).json({ error: 'Missing required fields: room, event' });
        }

        socketIO.to(room).emit(event, data);
        res.json({ success: true, room, event });
    } catch (error) {
        console.error('Error emitting Socket.IO event:', error);
        res.status(500).json({ error: 'Failed to emit event' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
