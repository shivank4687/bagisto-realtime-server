import redisService from '@services/redis.service';
import cacheService from '@services/cache.service';
import logger from '@services/logger.service';
import presenceService from '@services/presence.service';
import { AuthenticatedSocket, RoomMember } from 'types/socket.types';

class RFQService {
    getRoomName(quoteId: number, customerQuoteId: number): string {
        return `rfq:${quoteId}:${customerQuoteId}`;
    }

    async joinRoom(
        socket: AuthenticatedSocket,
        quoteId: number,
        customerQuoteId: number
    ): Promise<RoomMember[]> {
        const roomName = this.getRoomName(quoteId, customerQuoteId);

        await socket.join(roomName);
        logger.info(`${socket.data.user.name} joined room: ${roomName}`);

        // Store member info (uses Redis if available, memory otherwise)
        const memberKey = `room:${roomName}:members:${socket.id}`;
        const member: RoomMember = {
            socketId: socket.id,
            userId: socket.data.user.id,
            userName: socket.data.user.name,
            userType: socket.data.user.type,
        };

        await cacheService.set(memberKey, member, 3600);

        // Track which rooms this socket has joined (for disconnect cleanup)
        if (!socket.data.rfqRooms) {
            socket.data.rfqRooms = [];
        }
        socket.data.rfqRooms.push({ quoteId, customerQuoteId });

        // Set presence for notification suppression
        await presenceService.setPresence(
            socket.id,
            quoteId,
            customerQuoteId,
            socket.data.user.id,
            socket.data.user.name,
            socket.data.user.type as 'customer' | 'supplier'
        );

        return this.getRoomMembers(roomName);
    }

    async leaveRoom(
        socket: AuthenticatedSocket,
        quoteId: number,
        customerQuoteId: number
    ): Promise<void> {
        const roomName = this.getRoomName(quoteId, customerQuoteId);

        await socket.leave(roomName);
        logger.info(`${socket.data.user.name} left room: ${roomName}`);

        // Remove member info
        const memberKey = `room:${roomName}:members:${socket.id}`;
        await cacheService.delete(memberKey);

        // Remove presence
        await presenceService.removePresence(
            quoteId,
            customerQuoteId,
            socket.data.user.id,
            socket.data.user.type as 'customer' | 'supplier'
        );
    }

    async getRoomMembers(roomName: string): Promise<RoomMember[]> {
        // This is a simplified version
        // In production, you'd iterate through all member keys
        return [];
    }

    async broadcastMessage(
        socket: AuthenticatedSocket,
        roomName: string,
        message: any,
        quoteId?: number,
        customerQuoteId?: number
    ): Promise<void> {
        const messageData = {
            message,
            sender: socket.data.user,
            senderSocketId: socket.id, // Add socket ID to filter out sender
            timestamp: new Date().toISOString(),
        };

        // If Redis is enabled, use pub/sub for multi-server support
        if (redisService.isEnabled()) {
            await redisService.publish(`message:${roomName}`, messageData);
        } else {
            // Single server mode - emit directly (excludes sender automatically)
            socket.to(roomName).emit('rfq:new-message', messageData);
        }
    }
}

export default new RFQService();
