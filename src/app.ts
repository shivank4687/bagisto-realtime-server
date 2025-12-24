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
