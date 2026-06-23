import redisService from '@services/redis.service';
import cacheService from '@services/cache.service';
import logger from '@services/logger.service';

interface PresenceData {
    socketId: string;
    userId: number;
    userName: string;
    userType: 'customer' | 'supplier';
    timestamp: string;
}

class PresenceService {
    /**
     * Generate Redis key for presence tracking
     */
    private getPresenceKey(
        quoteId: number,
        customerQuoteId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): string {
        return `presence:rfq:${quoteId}:${customerQuoteId}:${userType}:${userId}`;
    }

    /**
     * Set user presence in chat room
     */
    async setPresence(
        socketId: string,
        quoteId: number,
        customerQuoteId: number,
        userId: number,
        userName: string,
        userType: 'customer' | 'supplier'
    ): Promise<void> {
        const key = this.getPresenceKey(quoteId, customerQuoteId, userId, userType);
        const data: PresenceData = {
            socketId,
            userId,
            userName,
            userType,
            timestamp: new Date().toISOString(),
        };

        // No TTL - presence stays until explicitly removed
        await cacheService.set(key, data);

        logger.info(`Presence set: ${userName} (${userType}) in RFQ ${quoteId}:${customerQuoteId}`);
    }

    /**
     * Remove user presence from chat room
     */
    async removePresence(
        quoteId: number,
        customerQuoteId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): Promise<void> {
        const key = this.getPresenceKey(quoteId, customerQuoteId, userId, userType);
        await cacheService.delete(key);

        logger.info(`Presence removed: ${userType} ${userId} from RFQ ${quoteId}:${customerQuoteId}`);
    }

    /**
     * Check if user is present in chat room
     */
    async isUserPresent(
        quoteId: number,
        customerQuoteId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): Promise<boolean> {
        const key = this.getPresenceKey(quoteId, customerQuoteId, userId, userType);
        const data = await cacheService.get<PresenceData>(key);

        return data !== null;
    }

    /**
     * Get presence data for a user
     */
    async getPresenceData(
        quoteId: number,
        customerQuoteId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): Promise<PresenceData | null> {
        const key = this.getPresenceKey(quoteId, customerQuoteId, userId, userType);
        return await cacheService.get<PresenceData>(key);
    }

    /**
     * Generate Redis key for order chat presence tracking
     */
    private getOrderPresenceKey(
        orderId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): string {
        return `presence:order:${orderId}:${userType}:${userId}`;
    }

    /**
     * Set user presence in order chat room
     */
    async setOrderPresence(
        socketId: string,
        orderId: number,
        userId: number,
        userName: string,
        userType: 'customer' | 'supplier'
    ): Promise<void> {
        const key = this.getOrderPresenceKey(orderId, userId, userType);
        const data: PresenceData = {
            socketId,
            userId,
            userName,
            userType,
            timestamp: new Date().toISOString(),
        };

        await cacheService.set(key, data);
        logger.info(`Presence set: ${userName} (${userType}) in Order ${orderId}`);
    }

    /**
     * Remove user presence from order chat room
     */
    async removeOrderPresence(
        orderId: number,
        userId: number,
        userType: 'customer' | 'supplier'
    ): Promise<void> {
        const key = this.getOrderPresenceKey(orderId, userId, userType);
        await cacheService.delete(key);
        logger.info(`Presence removed: ${userType} ${userId} from Order ${orderId}`);
    }
}

export default new PresenceService();
