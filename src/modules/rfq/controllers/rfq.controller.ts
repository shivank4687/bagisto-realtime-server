import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import rfqService from '../services/rfq.service';
import presenceService from '@services/presence.service';
import logger from '@services/logger.service';

export const setupRFQHandlers = (io: Server, socket: AuthenticatedSocket) => {
    // Join quote room
    socket.on('rfq:join', async (data: { quoteId: number; customerQuoteId: number }) => {
        try {
            const { quoteId, customerQuoteId } = data;
            const members = await rfqService.joinRoom(socket, quoteId, customerQuoteId);

            // Notify room
            const roomName = rfqService.getRoomName(quoteId, customerQuoteId);
            socket.to(roomName).emit('rfq:user-joined', {
                user: socket.data.user,
            });

            // Send current members to joining user
            socket.emit('rfq:room-members', members);
        } catch (error) {
            logger.error('Error joining RFQ room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Send message
    socket.on('rfq:send-message', async (data: {
        quoteId: number;
        customerQuoteId: number;
        message: any;
    }) => {
        try {
            const { quoteId, customerQuoteId, message } = data;
            const roomName = rfqService.getRoomName(quoteId, customerQuoteId);

            await rfqService.broadcastMessage(socket, roomName, message, quoteId, customerQuoteId);

            // Broadcast to room (handled by Redis subscription or direct emit)
        } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('rfq:typing', (data: { quoteId: number; customerQuoteId: number }) => {
        const { quoteId, customerQuoteId } = data;
        const roomName = rfqService.getRoomName(quoteId, customerQuoteId);

        socket.to(roomName).emit('rfq:user-typing', {
            user: socket.data.user,
        });
    });

    // Stop typing
    socket.on('rfq:stop-typing', (data: { quoteId: number; customerQuoteId: number }) => {
        const { quoteId, customerQuoteId } = data;
        const roomName = rfqService.getRoomName(quoteId, customerQuoteId);

        socket.to(roomName).emit('rfq:user-stopped-typing', {
            user: socket.data.user,
        });
    });


    // Leave room
    socket.on('rfq:leave', async (data: { quoteId: number; customerQuoteId: number }) => {
        try {
            const { quoteId, customerQuoteId } = data;
            await rfqService.leaveRoom(socket, quoteId, customerQuoteId);

            const roomName = rfqService.getRoomName(quoteId, customerQuoteId);
            socket.to(roomName).emit('rfq:user-left', {
                user: socket.data.user,
            });
        } catch (error) {
            logger.error('Error leaving RFQ room:', error);
        }
    });

    // Handle disconnect - cleanup presence for all rooms this socket joined
    socket.on('disconnect', async () => {
        try {
            // Clean up presence for all rooms this socket joined
            if (socket.data.rfqRooms) {
                for (const roomInfo of socket.data.rfqRooms) {
                    await presenceService.removePresence(
                        roomInfo.quoteId,
                        roomInfo.customerQuoteId,
                        socket.data.user.id,
                        socket.data.user.type as 'customer' | 'supplier'
                    );

                    logger.info(`Cleaned up presence for ${socket.data.user.name} in RFQ ${roomInfo.quoteId}:${roomInfo.customerQuoteId} on disconnect`);
                }
            }

            logger.debug(`Socket ${socket.id} disconnected`);
        } catch (error) {
            logger.error('Error handling disconnect:', error);
        }
    });
};
