import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import logger from '@services/logger.service';

import presenceService from '@services/presence.service';

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

    // Generic room join handler (used by Order Messages)
    socket.on('join-room', async (data: { room: string }) => {
        try {
            if (data.room) {
                await socket.join(data.room);
                logger.info(`${socket.data.user.name} joined room ${data.room}`);
                
                // Set presence for order chat rooms
                if (data.room.startsWith('order:')) {
                    const parts = data.room.split(':');
                    // Format: order:{supplierOrderId}:{supplierId}
                    if (parts.length >= 3) {
                        const supplierOrderId = parseInt(parts[1], 10);
                        if (!isNaN(supplierOrderId)) {
                            await presenceService.setOrderPresence(
                                socket.id,
                                supplierOrderId,
                                socket.data.user.id,
                                socket.data.user.name,
                                socket.data.user.type as 'customer' | 'supplier'
                            );
                            
                            if (!socket.data.orderRooms) {
                                socket.data.orderRooms = [];
                            }
                            if (!socket.data.orderRooms.includes(supplierOrderId)) {
                                socket.data.orderRooms.push(supplierOrderId);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Error joining room:', error);
        }
    });

    // Generic room leave handler (used by Order Messages)
    socket.on('leave-room', async (data: { room: string }) => {
        try {
            if (data.room) {
                await socket.leave(data.room);
                logger.info(`${socket.data.user.name} left room ${data.room}`);
                
                if (data.room.startsWith('order:')) {
                    const parts = data.room.split(':');
                    if (parts.length >= 3) {
                        const supplierOrderId = parseInt(parts[1], 10);
                        if (!isNaN(supplierOrderId)) {
                            await presenceService.removeOrderPresence(
                                supplierOrderId,
                                socket.data.user.id,
                                socket.data.user.type as 'customer' | 'supplier'
                            );
                            
                            if (socket.data.orderRooms) {
                                socket.data.orderRooms = socket.data.orderRooms.filter(id => id !== supplierOrderId);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Error leaving room:', error);
        }
    });
    
    // Handle disconnect - cleanup presence for all order rooms this socket joined
    socket.on('disconnect', async () => {
        try {
            if (socket.data.orderRooms) {
                for (const supplierOrderId of socket.data.orderRooms) {
                    await presenceService.removeOrderPresence(
                        supplierOrderId,
                        socket.data.user.id,
                        socket.data.user.type as 'customer' | 'supplier'
                    );
                    logger.info(`Cleaned up presence for ${socket.data.user.name} in Order ${supplierOrderId} on disconnect`);
                }
            }
        } catch (error) {
            logger.error('Error handling disconnect in order socket:', error);
        }
    });
};
