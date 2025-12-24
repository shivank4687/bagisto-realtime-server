import redisService from '@services/redis.service';
import cacheService from '@services/cache.service';
import logger from '@services/logger.service';
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
    }

    async getRoomMembers(roomName: string): Promise<RoomMember[]> {
        // This is a simplified version
        // In production, you'd iterate through all member keys
        return [];
    }

    async broadcastMessage(
        socket: AuthenticatedSocket,
        roomName: string,
        message: any
    ): Promise<void> {
        const messageData = {
            message,
            sender: socket.data.user,
            timestamp: new Date().toISOString(),
        };

        // If Redis is enabled, use pub/sub for multi-server support
        if (redisService.isEnabled()) {
            await redisService.publish(`message:${roomName}`, messageData);
        } else {
            // Single server mode - emit directly
            socket.to(roomName).emit('rfq:new-message', messageData);
        }
    }
}

export default new RFQService();
