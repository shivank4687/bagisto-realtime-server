import { Socket } from 'socket.io';
import authService from '@services/auth.service';
import logger from '@services/logger.service';
import { UserType } from 'types/user.types';

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token as string;
        const userType = socket.handshake.auth.userType as UserType;

        if (!token || !userType) {
            return next(new Error('Authentication credentials missing'));
        }

        const user = await authService.verifyToken(token, userType);

        if (!user) {
            return next(new Error('Invalid authentication credentials'));
        }

        // Attach user to socket
        socket.data.user = user;
        socket.data.token = token;

        logger.info(`User authenticated: ${user.name} (${user.type})`);
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        next(new Error('Authentication failed'));
    }
};
