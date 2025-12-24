# Bagisto Real-Time Server

Enterprise-grade Socket.IO server for real-time features in Bagisto B2B Marketplace.

## Features

- ✅ **Real-time RFQ Messages** - Instant messaging between suppliers and customers
- ✅ **Notifications** - Real-time notifications for suppliers and customers
- ✅ **Order Updates** - Live order status updates
- ✅ **TypeScript** - Type-safe codebase
- ✅ **Modular Architecture** - Easy to extend with new features
- ✅ **Optional Redis** - Works with or without Redis
- ✅ **Horizontal Scaling** - Redis pub/sub for multi-server deployments
- ✅ **Production Ready** - Logging, error handling, graceful shutdown

## Directory Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Socket.IO middleware
├── modules/         # Feature modules (RFQ, notifications, orders)
├── services/        # Shared services (auth, cache, logger, etc.)
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and configure your settings
nano .env
```

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `LARAVEL_API_URL` - Laravel API URL for authentication
- `REDIS_ENABLED` - Enable/disable Redis (true/false)
- `REDIS_HOST` - Redis host (if enabled)
- `SOCKET_CORS_ORIGIN` - Allowed CORS origins (comma-separated)

### Redis Configuration

**Development (No Redis):**
```env
REDIS_ENABLED=false
```

**Production (With Redis):**
```env
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Using PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/server.js --name bagisto-realtime

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-23T16:30:00.000Z",
  "uptime": 123.45,
  "cache": {
    "size": 10,
    "redisEnabled": false
  }
}
```

### Metrics
```
GET /metrics
```

## Socket.IO Events

### RFQ Module

**Client → Server:**
- `rfq:join` - Join a quote room
- `rfq:leave` - Leave a quote room
- `rfq:send-message` - Send a message
- `rfq:typing` - User is typing
- `rfq:stop-typing` - User stopped typing

**Server → Client:**
- `rfq:new-message` - New message received
- `rfq:user-joined` - User joined room
- `rfq:user-left` - User left room
- `rfq:user-typing` - User is typing
- `rfq:user-stopped-typing` - User stopped typing
- `rfq:room-members` - Current room members

### Notifications Module

**Client → Server:**
- `notification:subscribe` - Subscribe to notifications
- `notification:unsubscribe` - Unsubscribe from notifications

### Orders Module

**Client → Server:**
- `order:subscribe` - Subscribe to order updates
- `order:unsubscribe` - Unsubscribe from order updates

## Client Connection Example

### Web (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'user-api-token',
    userType: 'customer' // or 'supplier'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  
  // Join RFQ room
  socket.emit('rfq:join', {
    quoteId: 123,
    customerQuoteId: 456
  });
});

socket.on('rfq:new-message', (data) => {
  console.log('New message:', data);
});
```

### Mobile (React Native)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://your-server:3000', {
  auth: {
    token: userToken,
    userType: 'customer'
  }
});

socket.on('rfq:new-message', (data) => {
  // Handle new message
});
```

## Scaling

### Single Server (No Redis)
Perfect for development and small deployments.

### Multi-Server (With Redis)
Enable Redis for horizontal scaling:

```env
REDIS_ENABLED=true
REDIS_HOST=redis.example.com
```

Redis pub/sub ensures messages are broadcast across all server instances.

## Logging

Logs are written to:
- Console (colored output)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
```

## Troubleshooting

### Connection Issues

1. Check CORS configuration in `.env`
2. Verify Laravel API is accessible
3. Check authentication token is valid

### Redis Issues

1. Verify Redis is running: `redis-cli ping`
2. Check Redis connection settings in `.env`
3. Fallback to in-memory mode: `REDIS_ENABLED=false`

## License

MIT
