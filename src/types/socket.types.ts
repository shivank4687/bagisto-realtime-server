import { Socket as IOSocket } from 'socket.io';
import { User } from './user.types';

export interface SocketData {
    user: User;
    token: string;
}

export type AuthenticatedSocket = IOSocket<any, any, any, SocketData>;

export interface RoomMember {
    socketId: string;
    userId: number;
    userName: string;
    userType: string;
}
