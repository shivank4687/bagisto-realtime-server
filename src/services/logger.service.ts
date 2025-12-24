import winston from 'winston';
import path from 'path';
import { config } from '@config/index';
import fs from 'fs';

// Ensure logs directory exists
if (!fs.existsSync(config.logging.dir)) {
    fs.mkdirSync(config.logging.dir, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'bagisto-realtime-server' },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: path.join(config.logging.dir, 'combined.log'),
        }),
        // Write errors to error.log
        new winston.transports.File({
            filename: path.join(config.logging.dir, 'error.log'),
            level: 'error',
        }),
    ],
});

export default logger;
