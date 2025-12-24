import { Socket } from 'socket.io';
import logger from '@services/logger.service';

export const errorMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    socket.on('error', (error) => {
        logger.error(`Socket error for user ${socket.data.user?.name}:`, error);
    });

    next();
};
