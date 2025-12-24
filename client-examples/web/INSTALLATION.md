# Socket.IO Client Installation Guide for Bagisto

## Understanding Bagisto's Package Structure

Bagisto uses a **modular package architecture** where each package has its own:
- `package.json` - Dependencies
- `vite.config.js` - Build configuration  
- `src/Resources/assets/` - Frontend assets

### Package Structure

```
Bagisto/
├── package.json                    # Root (minimal, just Vite)
└── packages/Webkul/
    ├── Shop/                       # Shop theme package
    │   ├── package.json
    │   ├── vite.config.js
    │   └── src/Resources/assets/
    │
    ├── B2BMarketplace/             # B2B Marketplace package (RFQ is here!)
    │   ├── package.json            ✅ Install socket.io-client HERE
    │   ├── vite.config.js
    │   └── src/Resources/assets/
    │       └── js/
    │           ├── app.js          # Main entry point
    │           └── plugins/        # Vue plugins
    │
    └── Admin/                      # Admin panel package
        ├── package.json
        └── vite.config.js
```

---

## Installation Steps

### Step 1: Install Socket.IO Client in B2BMarketplace Package

```bash
cd Bagisto/packages/Webkul/B2BMarketplace
npm install socket.io-client
```

> **Why here?** Because the RFQ functionality (supplier/customer quote views) is in the B2BMarketplace package.

### Step 2: Create Socket Service

Create the socket service file:

```bash
# Create the service file
touch src/Resources/assets/js/plugins/socket.js
```

**File:** `Bagisto/packages/Webkul/B2BMarketplace/src/Resources/assets/js/plugins/socket.js`

```javascript
import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    }

    connect(token, userType) {
        if (this.socket && this.connected) {
            console.log('Already connected to Socket.IO');
            return;
        }

        this.socket = io(this.serverUrl, {
            auth: { token, userType },
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
    }

    joinRFQRoom(quoteId, customerQuoteId) {
        if (!this.socket) return;
        this.socket.emit('rfq:join', { quoteId, customerQuoteId });
    }

    leaveRFQRoom(quoteId, customerQuoteId) {
        if (!this.socket) return;
        this.socket.emit('rfq:leave', { quoteId, customerQuoteId });
    }

    sendRFQMessage(quoteId, customerQuoteId, message) {
        if (!this.socket) return;
        this.socket.emit('rfq:send-message', { quoteId, customerQuoteId, message });
    }

    onNewMessage(callback) {
        if (!this.socket) return;
        this.socket.on('rfq:new-message', callback);
    }

    offNewMessage() {
        if (!this.socket) return;
        this.socket.off('rfq:new-message');
    }

    onUserTyping(callback) {
        if (!this.socket) return;
        this.socket.on('rfq:user-typing', callback);
    }

    onUserStoppedTyping(callback) {
        if (!this.socket) return;
        this.socket.on('rfq:user-stopped-typing', callback);
    }

    emitTyping(quoteId, customerQuoteId) {
        if (!this.socket) return;
        this.socket.emit('rfq:typing', { quoteId, customerQuoteId });
    }

    emitStopTyping(quoteId, customerQuoteId) {
        if (!this.socket) return;
        this.socket.emit('rfq:stop-typing', { quoteId, customerQuoteId });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected;
    }
}

// Export singleton instance
export default new SocketService();
```

### Step 3: Register as Vue Plugin (Optional but Recommended)

**File:** `Bagisto/packages/Webkul/B2BMarketplace/src/Resources/assets/js/plugins/socket-plugin.js`

```javascript
import SocketService from './socket';

export default {
    install(app) {
        // Make SocketService available globally
        app.config.globalProperties.$socket = SocketService;
        
        // Also provide it for Composition API
        app.provide('socket', SocketService);
    }
};
```

### Step 4: Register Plugin in app.js

**File:** `Bagisto/packages/Webkul/B2BMarketplace/src/Resources/assets/js/app.js`

Add after line 57:

```javascript
import SocketPlugin from "./plugins/socket-plugin";

[Axios, Emitter, Shop, createElement, VeeValidate, Admin, Flatpickr, SocketPlugin].forEach((plugin) => app.use(plugin));
```

### Step 5: Configure Environment Variable

**File:** `Bagisto/.env`

Add:

```env
VITE_SOCKET_URL=http://localhost:3000
```

For production:
```env
VITE_SOCKET_URL=https://your-domain.com
```

### Step 6: Build Assets

```bash
cd Bagisto/packages/Webkul/B2BMarketplace

# Development (watch mode)
npm run dev

# Production build
npm run build
```

---

## Usage in Vue Components

### Option 1: Using Global Property (Options API)

```javascript
export default {
    mounted() {
        const token = '{{ auth()->guard("supplier")->user()->api_token }}';
        
        // Access via this.$socket
        this.$socket.connect(token, 'supplier');
        this.$socket.joinRFQRoom(this.quoteId, this.customerQuoteId);
        
        this.$socket.onNewMessage((data) => {
            console.log('New message:', data);
        });
    },

    beforeUnmount() {
        this.$socket.leaveRFQRoom(this.quoteId, this.customerQuoteId);
        this.$socket.disconnect();
    }
};
```

### Option 2: Direct Import

```javascript
import SocketService from '../plugins/socket';

export default {
    mounted() {
        const token = '{{ auth()->guard("supplier")->user()->api_token }}';
        
        SocketService.connect(token, 'supplier');
        SocketService.joinRFQRoom(this.quoteId, this.customerQuoteId);
        
        SocketService.onNewMessage((data) => {
            console.log('New message:', data);
        });
    },

    beforeUnmount() {
        SocketService.leaveRFQRoom(this.quoteId, this.customerQuoteId);
        SocketService.disconnect();
    }
};
```

---

## Vite Build Process

When you run `npm run dev` or `npm run build`:

1. Vite reads `vite.config.js`
2. Processes `src/Resources/assets/js/app.js` (entry point)
3. Bundles all imports including `socket.io-client`
4. Outputs to `publishable/build/` directory
5. Laravel serves these assets via Vite helper

---

## Troubleshooting

### Issue: "Cannot find module 'socket.io-client'"

**Solution:**
```bash
# Make sure you're in the correct directory
cd Bagisto/packages/Webkul/B2BMarketplace

# Install dependencies
npm install

# Verify socket.io-client is in package.json
cat package.json | grep socket.io-client
```

### Issue: Changes not reflecting

**Solution:**
```bash
# Stop Vite dev server (Ctrl+C)
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Issue: "app.use is not a function"

**Solution:** Make sure the plugin export has an `install` method:

```javascript
export default {
    install(app) {
        // Plugin code
    }
};
```

---

## Production Deployment

### 1. Build Assets

```bash
cd Bagisto/packages/Webkul/B2BMarketplace
npm run build
```

### 2. Update Environment

```env
VITE_SOCKET_URL=https://your-domain.com
APP_ENV=production
```

### 3. Clear Cache

```bash
cd Bagisto
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

---

## Summary

✅ **Install in:** `Bagisto/packages/Webkul/B2BMarketplace`  
✅ **Entry point:** `src/Resources/assets/js/app.js`  
✅ **Service location:** `src/Resources/assets/js/plugins/socket.js`  
✅ **Build command:** `npm run dev` or `npm run build`  
✅ **Access in components:** `this.$socket` or import directly

The Socket.IO client will be bundled with your B2BMarketplace assets and available throughout the supplier/customer RFQ views! 🚀
