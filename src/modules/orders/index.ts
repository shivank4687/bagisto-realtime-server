import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import { setupOrderHandlers } from './controllers/order.controller';

export const initializeOrderModule = (io: Server, socket: AuthenticatedSocket) => {
    setupOrderHandlers(io, socket);
};
