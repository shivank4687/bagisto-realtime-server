import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import logger from '@services/logger.service';

export const setupNotificationHandlers = (io: Server, socket: AuthenticatedSocket) => {
    // Subscribe to notifications
    socket.on('notification:subscribe', async () => {
        try {
            const userRoom = `notifications:${socket.data.user.type}:${socket.data.user.id}`;
            await socket.join(userRoom);
            logger.info(`${socket.data.user.name} subscribed to notifications`);
        } catch (error) {
            logger.error('Error subscribing to notifications:', error);
        }
    });

    // Unsubscribe from notifications
    socket.on('notification:unsubscribe', async () => {
        try {
            const userRoom = `notifications:${socket.data.user.type}:${socket.data.user.id}`;
            await socket.leave(userRoom);
            logger.info(`${socket.data.user.name} unsubscribed from notifications`);
        } catch (error) {
            logger.error('Error unsubscribing from notifications:', error);
        }
    });
};
