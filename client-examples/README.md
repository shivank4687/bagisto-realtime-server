# Socket.IO Client Integration Guide

## Overview

Connect to Socket.IO real-time server when users open the **Quote Response Detail** screen (where they can view and send messages).

## Key Concept

**Connect when:** User opens Quote Response Detail screen  
**Join room when:** User switches to Messages tab  
**Disconnect when:** User leaves the screen

This approach ensures:
- ✅ Minimal server connections
- ✅ Real-time messages only when needed
- ✅ Better battery life on mobile
- ✅ Reduced server load

---

## Mobile Integration (React Native)

### 1. Install Dependencies

```bash
cd MyFirstApp
npm install socket.io-client
```

### 2. Copy Service File

```bash
cp client-examples/mobile/socket.service.ts MyFirstApp/src/services/
```

### 3. Update Server URL

Edit `socket.service.ts`:
```typescript
private serverUrl: string = 'http://192.168.1.100:3000'; // Your local IP
// private serverUrl: string = 'https://your-domain.com'; // Production
```

### 4. Integrate in Quote Response Detail Screen

See complete example: [`QuoteResponseDetailScreen.example.tsx`](./mobile/QuoteResponseDetailScreen.example.tsx)

**Key Points:**
- Connect to Socket.IO in `useEffect` when screen mounts
- Join RFQ room when Messages tab becomes active
- Leave room when switching away from Messages tab
- Disconnect when screen unmounts

**Lifecycle:**
```
Screen Opens → Connect to Socket.IO
    ↓
Messages Tab Active → Join RFQ Room → Listen for messages
    ↓
Switch to Details Tab → Leave RFQ Room
    ↓
Screen Closes → Disconnect from Socket.IO
```

---

## Web Integration (Supplier/Customer Panels)

### 1. Install Dependencies

```bash
cd Bagisto
npm install socket.io-client
```

### 2. Copy Service File

```bash
cp client-examples/web/socket.service.js \
   Bagisto/packages/Webkul/B2BMarketplace/src/Resources/assets/js/
```

### 3. Update Server URL

Edit `socket.service.js`:
```javascript
this.serverUrl = 'http://localhost:3000'; // Development
// this.serverUrl = 'https://your-domain.com'; // Production
```

### 4. Integrate in RFQ View Component

See complete example: [`SupplierRFQView.example.js`](./web/SupplierRFQView.example.js)

**Key Points:**
- Connect to Socket.IO in `mounted()` hook
- Use `watch` to detect tab changes
- Join room when Messages tab is activated
- Leave room when switching away
- Disconnect in `beforeUnmount()` hook

**Lifecycle:**
```
Component Mounts → Connect to Socket.IO
    ↓
Messages Tab Clicked → Join RFQ Room → Listen for messages
    ↓
Quotes Tab Clicked → Leave RFQ Room
    ↓
Component Unmounts → Disconnect from Socket.IO
```

---

## Testing

### 1. Start Socket.IO Server

```bash
cd bagisto-realtime-server
npm run dev
```

### 2. Test from Mobile

1. Open Quote Response Detail screen
2. Check console: Should see "Connected to Socket.IO"
3. Switch to Messages tab
4. Check console: Should see "Joining RFQ room"
5. Send a message from web
6. Should appear instantly in mobile app

### 3. Test from Web

1. Open Supplier/Customer RFQ view
2. Click Messages tab
3. Check browser console: Should see "Joining RFQ room"
4. Send a message from mobile
5. Should appear instantly in web

---

## Events Flow

### When User Opens Quote Response Detail

```
Mobile/Web → Socket.IO Server
    ↓
Server validates token with Laravel API
    ↓
Connection established ✅
```

### When User Switches to Messages Tab

```
Client emits: rfq:join
    ↓
Server adds client to room
    ↓
Server emits: rfq:room-members
    ↓
Client starts listening for: rfq:new-message
```

### When User Sends Message

```
Client → Laravel API (save to database)
    ↓
Laravel returns saved message
    ↓
Client emits: rfq:send-message via Socket.IO
    ↓
Server broadcasts to room: rfq:new-message
    ↓
All clients in room receive message instantly ⚡
```

### When User Switches Away from Messages Tab

```
Client emits: rfq:leave
    ↓
Server removes client from room
    ↓
Client stops listening for messages
```

### When User Closes Screen

```
Client disconnects from Socket.IO
    ↓
Server cleans up connection
```

---

## Best Practices

### ✅ DO

- Connect when opening Quote Response Detail screen
- Join room only when Messages tab is active
- Disconnect when leaving the screen
- Save messages to database via API first
- Then broadcast via Socket.IO for real-time delivery
- Handle connection errors gracefully
- Show typing indicators for better UX

### ❌ DON'T

- Don't connect on app startup
- Don't stay connected when not viewing messages
- Don't rely only on Socket.IO (always save to DB first)
- Don't forget to disconnect on unmount
- Don't join multiple rooms simultaneously

---

## Troubleshooting

### Messages Not Appearing

**Check:**
1. Is Socket.IO server running? `curl http://localhost:3000/health`
2. Is client connected? Check console for "Connected" message
3. Did client join room? Check console for "Joining RFQ room"
4. Are `quoteId` and `customerQuoteId` correct?
5. Is Laravel API endpoint working? Test `/api/socket/verify-token`

### Connection Fails

**Check:**
1. Server URL is correct
2. CORS is configured in server `.env`
3. Token is valid
4. Network allows WebSocket connections

### Typing Indicators Not Working

**Check:**
1. `emitTyping()` is called on text input
2. `emitStopTyping()` is called after timeout
3. Listener is set up: `onUserTyping()`

---

## Production Checklist

- [ ] Update server URL to production domain
- [ ] Enable HTTPS/WSS
- [ ] Configure CORS for production domains
- [ ] Enable Redis for multi-server scaling
- [ ] Set up PM2 for server process management
- [ ] Configure Nginx proxy (if needed)
- [ ] Test on production environment
- [ ] Monitor server logs
- [ ] Set up error tracking

---

## Support

- **Server Docs:** `../README.md`
- **Socket.IO Docs:** https://socket.io/docs/
- **Example Files:**
  - Mobile: `QuoteResponseDetailScreen.example.tsx`
  - Web: `SupplierRFQView.example.js`
