import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'types/socket.types';
import { setupRFQHandlers } from './controllers/rfq.controller';

export const initializeRFQModule = (io: Server, socket: AuthenticatedSocket) => {
    setupRFQHandlers(io, socket);
};
