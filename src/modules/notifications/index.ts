import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import { setupNotificationHandlers } from './controllers/notification.controller';

export const initializeNotificationModule = (io: Server, socket: AuthenticatedSocket) => {
    setupNotificationHandlers(io, socket);
};
