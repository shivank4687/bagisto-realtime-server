import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import logger from '@services/logger.service';

export const setupOrderHandlers = (io: Server, socket: AuthenticatedSocket) => {
    // Subscribe to order updates
    socket.on('order:subscribe', async (data: { orderId: number }) => {
        try {
            const orderRoom = `order:${data.orderId}`;
            await socket.join(orderRoom);
            logger.info(`${socket.data.user.name} subscribed to order ${data.orderId}`);
        } catch (error) {
            logger.error('Error subscribing to order:', error);
        }
    });

    // Unsubscribe from order updates
    socket.on('order:unsubscribe', async (data: { orderId: number }) => {
        try {
            const orderRoom = `order:${data.orderId}`;
            await socket.leave(orderRoom);
            logger.info(`${socket.data.user.name} unsubscribed from order ${data.orderId}`);
        } catch (error) {
            logger.error('Error unsubscribing from order:', error);
        }
    });
};
