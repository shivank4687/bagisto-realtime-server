# Socket.IO Integration - Quick Reference

## ✅ What's Been Done

### 1. Installed Socket.IO Client
```bash
cd Bagisto/packages/Webkul/B2BMarketplace
npm install socket.io-client ✅
```

### 2. Created Files
- ✅ `src/Resources/assets/js/plugins/socket.js` - Socket service
- ✅ `src/Resources/assets/js/plugins/socket-plugin.js` - Vue plugin
- ✅ Updated `src/Resources/assets/js/app.js` - Registered plugin

### 3. Built Assets
```bash
npm run build ✅
```

Assets are now in: `publishable/build/assets/app-*.js`

---

## 🚀 How to Use

### In Vue Components (Options API)

```javascript
export default {
    data() {
        return {
            quoteId: 1,
            customerQuoteId: 1,
        };
    },

    mounted() {
        // Get token from Laravel
        const token = '{{ auth()->guard("supplier")->user()->api_token }}';
        
        // Connect to Socket.IO
        this.$socket.connect(token, 'supplier');
        
        // Join RFQ room when Messages tab is active
        this.$socket.joinRFQRoom(this.quoteId, this.customerQuoteId);
        
        // Listen for new messages
        this.$socket.onNewMessage((data) => {
            console.log('📨 New message:', data);
            
            // Add to your messages array
            this.messages.push({
                text: data.message.message,
                sender: data.sender.name,
                timestamp: data.timestamp,
            });
        });
    },

    beforeUnmount() {
        // Clean up
        this.$socket.leaveRFQRoom(this.quoteId, this.customerQuoteId);
        this.$socket.disconnect();
    },

    methods: {
        sendMessage() {
            // Save to database first
            this.$axios.post('/api/rfq/message', {
                message: this.newMessage,
                // ... other fields
            }).then(response => {
                // Broadcast via Socket.IO
                this.$socket.sendRFQMessage(
                    this.quoteId,
                    this.customerQuoteId,
                    response.data
                );
            });
        }
    }
};
```

---

## 📝 Environment Configuration

Add to `Bagisto/.env`:

```env
VITE_SOCKET_URL=http://localhost:3000
```

For production:
```env
VITE_SOCKET_URL=https://your-domain.com
```

---

## 🔄 Development Workflow

### Watch Mode (Auto-rebuild on changes)
```bash
cd Bagisto/packages/Webkul/B2BMarketplace
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🎯 Available Methods

| Method | Description |
|--------|-------------|
| `this.$socket.connect(token, userType)` | Connect to Socket.IO server |
| `this.$socket.joinRFQRoom(quoteId, customerQuoteId)` | Join RFQ room |
| `this.$socket.leaveRFQRoom(quoteId, customerQuoteId)` | Leave RFQ room |
| `this.$socket.sendRFQMessage(quoteId, customerQuoteId, message)` | Send message |
| `this.$socket.onNewMessage(callback)` | Listen for new messages |
| `this.$socket.offNewMessage()` | Stop listening for messages |
| `this.$socket.emitTyping(quoteId, customerQuoteId)` | Send typing indicator |
| `this.$socket.emitStopTyping(quoteId, customerQuoteId)` | Stop typing indicator |
| `this.$socket.onUserTyping(callback)` | Listen for typing |
| `this.$socket.onUserStoppedTyping(callback)` | Listen for stop typing |
| `this.$socket.disconnect()` | Disconnect from server |
| `this.$socket.isConnected()` | Check connection status |

---

## ✅ Next Steps

1. **Add to Supplier RFQ View:**
   - Open: `Bagisto/packages/Webkul/B2BMarketplace/src/Resources/views/supplier/request-quote/view.blade.php`
   - Add Socket.IO integration in the Vue component
   - See example: `bagisto-realtime-server/client-examples/web/SupplierRFQView.example.js`

2. **Add to Customer RFQ View:**
   - Open: `Bagisto/packages/Webkul/B2BMarketplace/src/Resources/views/shop/customers/request-quote/view.blade.php`
   - Add Socket.IO integration in the Vue component

3. **Test:**
   - Start Socket.IO server: `cd bagisto-realtime-server && npm run dev`
   - Open supplier RFQ view
   - Open customer RFQ view
   - Send messages and see them appear in real-time!

---

## 🐛 Troubleshooting

### Changes not reflecting?
```bash
# Clear cache
cd Bagisto
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Rebuild assets
cd packages/Webkul/B2BMarketplace
npm run build
```

### Socket not connecting?
- Check Socket.IO server is running: `curl http://localhost:3000/health`
- Check browser console for errors
- Verify `VITE_SOCKET_URL` in `.env`

---

## 📚 Documentation

- **Installation Guide:** `bagisto-realtime-server/client-examples/web/INSTALLATION.md`
- **Integration Examples:** `bagisto-realtime-server/client-examples/web/`
- **Server Docs:** `bagisto-realtime-server/README.md`
