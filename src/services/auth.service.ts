import httpService from './http.service';
import cacheService from './cache.service';
import logger from './logger.service';
import { User, UserType } from 'types/user.types';

class AuthService {
    async verifyToken(token: string, userType: UserType): Promise<User | null> {
        try {
            // Check cache first (uses Redis if available, memory otherwise)
            const cacheKey = `auth:${userType}:${token}`;
            const cachedUser = await cacheService.get<User>(cacheKey);

            if (cachedUser) {
                logger.debug('User found in cache');
                return cachedUser;
            }

            // Verify with Laravel API
            const response = await httpService.post<{ valid: boolean; user: User }>(
                '/api/v1/socket/verify-token',
                { token, userType }
            );

            if (response.valid && response.user) {
                // Cache for 1 hour
                await cacheService.set(cacheKey, response.user, 3600);
                return response.user;
            }

            return null;
        } catch (error) {
            logger.error('Token verification failed:', error);
            return null;
        }
    }

    async invalidateToken(token: string, userType: UserType): Promise<void> {
        const cacheKey = `auth:${userType}:${token}`;
        await cacheService.delete(cacheKey);
    }
}

export default new AuthService();
