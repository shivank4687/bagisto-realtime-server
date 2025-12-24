/**
 * Socket.IO Service for Bagisto Web Application
 * 
 * Usage in Supplier/Customer RFQ Chat:
 * 1. Import this service
 * 2. Connect with user token
 * 3. Join RFQ room
 * 4. Listen for messages
 */

import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = 'http://localhost:3000'; // Update for production
    }

    /**
     * Connect to Socket.IO server
     * @param {string} token - User API token
     * @param {string} userType - 'customer' or 'supplier'
     */
    connect(token, userType) {
        if (this.socket && this.connected) {
            console.log('Already connected to Socket.IO');
            return;
        }

        this.socket = io(this.serverUrl, {
            auth: {
                token: token,
                userType: userType
            },
            transports: ['websocket', 'polling']
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

        this.socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
    }

    /**
     * Join an RFQ room
     * @param {number} quoteId 
     * @param {number} customerQuoteId 
     */
    joinRFQRoom(quoteId, customerQuoteId) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:join', {
            quoteId,
            customerQuoteId
        });

        console.log(`Joining RFQ room: ${quoteId}-${customerQuoteId}`);
    }

    /**
     * Leave an RFQ room
     * @param {number} quoteId 
     * @param {number} customerQuoteId 
     */
    leaveRFQRoom(quoteId, customerQuoteId) {
        if (!this.socket) return;

        this.socket.emit('rfq:leave', {
            quoteId,
            customerQuoteId
        });
    }

    /**
     * Send a message in RFQ room
     * @param {number} quoteId 
     * @param {number} customerQuoteId 
     * @param {object} message 
     */
    sendRFQMessage(quoteId, customerQuoteId, message) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('rfq:send-message', {
            quoteId,
            customerQuoteId,
            message
        });
    }

    /**
     * Listen for new messages
     * @param {function} callback 
     */
    onNewMessage(callback) {
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
     * @param {function} callback 
     */
    onUserJoined(callback) {
        if (!this.socket) return;

        this.socket.on('rfq:user-joined', callback);
    }

    /**
     * Listen for user left
     * @param {function} callback 
     */
    onUserLeft(callback) {
        if (!this.socket) return;

        this.socket.on('rfq:user-left', callback);
    }

    /**
     * Listen for room members
     * @param {function} callback 
     */
    onRoomMembers(callback) {
        if (!this.socket) return;

        this.socket.on('rfq:room-members', callback);
    }

    /**
     * Emit typing indicator
     * @param {number} quoteId 
     * @param {number} customerQuoteId 
     */
    emitTyping(quoteId, customerQuoteId) {
        if (!this.socket) return;

        this.socket.emit('rfq:typing', {
            quoteId,
            customerQuoteId
        });
    }

    /**
     * Emit stop typing
     * @param {number} quoteId 
     * @param {number} customerQuoteId 
     */
    emitStopTyping(quoteId, customerQuoteId) {
        if (!this.socket) return;

        this.socket.emit('rfq:stop-typing', {
            quoteId,
            customerQuoteId
        });
    }

    /**
     * Listen for typing indicator
     * @param {function} callback 
     */
    onUserTyping(callback) {
        if (!this.socket) return;

        this.socket.on('rfq:user-typing', callback);
    }

    /**
     * Listen for stop typing
     * @param {function} callback 
     */
    onUserStoppedTyping(callback) {
        if (!this.socket) return;

        this.socket.on('rfq:user-stopped-typing', callback);
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
     * @returns {boolean}
     */
    isConnected() {
        return this.connected;
    }
}

// Export singleton instance
export default new SocketService();
