/**
 * Socket.IO Service for React Native Mobile App
 * 
 * Usage in Quote Response Detail Screen (Messages Tab):
 * 1. Import this service
 * 2. Connect when user opens Quote Response Detail screen
 * 3. Join RFQ room when Messages tab is active
 * 4. Listen for real-time messages
 * 5. Disconnect when leaving the screen
 */

import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private serverUrl: string = 'http://192.168.1.100:3000'; // Update with your server IP

    /**
     * Connect to Socket.IO server
     */
    connect(token: string, userType: 'customer' | 'supplier') {
        if (this.socket && this.connected) {
            console.log('Already connected to Socket.IO');
            return;
        }

        this.socket = io(this.serverUrl, {
            auth: {
                token,
                userType,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error.message);
        });

        this.socket.on('error', (error: any) => {
            console.error('Socket.IO error:', error);
        });
    }

    /**
     * Join an RFQ room
     */
    joinRFQRoom(quoteId: number, customerQuoteId: number) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:join', {
            quoteId,
            customerQuoteId,
        });

        console.log(`Joining RFQ room: ${quoteId}-${customerQuoteId}`);
    }

    /**
     * Leave an RFQ room
     */
    leaveRFQRoom(quoteId: number, customerQuoteId: number) {
        if (!this.socket) return;

        this.socket.emit('rfq:leave', {
            quoteId,
            customerQuoteId,
        });
    }

    /**
     * Send a message in RFQ room
     */
    sendRFQMessage(quoteId: number, customerQuoteId: number, message: any) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:send-message', {
            quoteId,
            customerQuoteId,
            message,
        });
    }

    /**
     * Listen for new messages
     */
    onNewMessage(callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.on('rfq:new-message', callback);
    }

    /**
     * Remove message listener
     */
    offNewMessage() {
        if (!this.socket) return;

        this.socket.off('rfq:new-message');
    }

    /**
     * Listen for user joined
     */
    onUserJoined(callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.on('rfq:user-joined', callback);
    }

    /**
     * Listen for user left
     */
    onUserLeft(callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.on('rfq:user-left', callback);
    }

    /**
     * Emit typing indicator
     */
    emitTyping(quoteId: number, customerQuoteId: number) {
        if (!this.socket) return;

        this.socket.emit('rfq:typing', {
            quoteId,
            customerQuoteId,
        });
    }

    /**
     * Emit stop typing
     */
    emitStopTyping(quoteId: number, customerQuoteId: number) {
        if (!this.socket) return;

        this.socket.emit('rfq:stop-typing', {
            quoteId,
            customerQuoteId,
        });
    }

    /**
     * Listen for typing indicator
     */
    onUserTyping(callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.on('rfq:user-typing', callback);
    }

    /**
     * Listen for stop typing
     */
    onUserStoppedTyping(callback: (data: any) => void) {
        if (!this.socket) return;

        this.socket.on('rfq:user-stopped-typing', callback);
    }

    /**
     * Subscribe to notifications
     */
    subscribeToNotifications() {
        if (!this.socket) return;

        this.socket.emit('notification:subscribe');
    }

    /**
     * Unsubscribe from notifications
     */
    unsubscribeFromNotifications() {
        if (!this.socket) return;

        this.socket.emit('notification:unsubscribe');
    }

    /**
     * Disconnect from Socket.IO
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            console.log('Socket.IO disconnected');
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected;
    }
}

// Export singleton instance
export default new SocketService();
