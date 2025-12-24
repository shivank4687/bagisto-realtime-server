/**
 * Example: Supplier RFQ View with Real-Time Messages
 * 
 * This is the supplier's quote response view with tabs for:
 * - Quotes (quote details and pricing)
 * - Messages (real-time chat with customer)
 * 
 * Socket.IO connection is established when the component mounts
 * and the Messages tab is activated.
 */

import SocketService from '../socket.service.js';

export default {
    template: '#v-supplier-rfq-tabs-template',

    props: {
        quote: Object,
        customerQuote: Object,
        supplierFirstQuote: Object,
        supplierLastQuote: Object,
        supplierQuotes: Array,
        quoteMessages: Array,
        supplierName: String,
        customerName: String
    },

    data() {
        return {
            activeTab: 'quotes', // 'quotes' or 'messages'
            chatDetails: [],
            message: {
                newMessage: ''
            },
            isTyping: false,
            typingUser: null,
            socketConnected: false
        }
    },

    mounted() {
        // Get supplier token from Laravel
        const token = '{{ auth()->guard("supplier")->user()->api_token }}';

        // Connect to Socket.IO when component mounts
        console.log('📱 Supplier RFQ view opened');
        SocketService.connect(token, 'supplier');
        this.socketConnected = true;

        // Load existing messages
        this.loadMessages();
    },

    beforeUnmount() {
        console.log('📱 Leaving Supplier RFQ view');

        // Leave room if in Messages tab
        if (this.activeTab === 'messages') {
            SocketService.leaveRFQRoom(this.quote.id, this.customerQuote.id);
        }

        // Disconnect from Socket.IO
        SocketService.disconnect();
        this.socketConnected = false;
    },

    watch: {
        // Watch for tab changes
        activeTab(newTab, oldTab) {
            if (newTab === 'messages') {
                console.log('💬 Messages tab activated - joining RFQ room');
                this.joinRFQRoom();
            } else if (oldTab === 'messages') {
                console.log('💬 Messages tab deactivated - leaving RFQ room');
                this.leaveRFQRoom();
            }
        }
    },

    methods: {
        loadMessages() {
            const msgs = typeof this.quoteMessages === 'string'
                ? JSON.parse(this.quoteMessages)
                : this.quoteMessages;

            this.chatDetails = msgs.map(msg => {
                const date = new Date(msg.created_at);
                const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ][date.getMonth()];

                return {
                    ...msg,
                    created_at: month + '-' + date.getDate() + '-' + date.getFullYear() +
                        ' ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
                };
            });

            // Scroll to bottom after messages are rendered
            this.$nextTick(() => {
                this.scrollToBottom();
                setTimeout(() => this.scrollToBottom(), 100);
            });
        },

        joinRFQRoom() {
            if (!this.socketConnected) {
                console.error('Socket not connected');
                return;
            }

            // Join RFQ room
            SocketService.joinRFQRoom(this.quote.id, this.customerQuote.id);

            // Listen for new messages
            SocketService.onNewMessage((data) => {
                console.log('📨 New message received:', data);

                // Format message
                const formattedMessage = {
                    message: data.message.message,
                    customer_id: data.sender.type === 'customer' ? data.sender.id : null,
                    supplier_id: data.sender.type === 'supplier' ? data.sender.id : null,
                    created_at: this.formatTimestamp(data.timestamp)
                };

                // Add to chat
                this.chatDetails.push(formattedMessage);
                this.scrollToBottom();

                // Show notification
                this.$emitter.emit('add-flash', {
                    type: 'info',
                    message: `New message from ${data.sender.name}`
                });
            });

            // Listen for typing indicators
            SocketService.onUserTyping((data) => {
                if (data.user.type === 'customer') {
                    this.typingUser = data.user.name;
                }
            });

            SocketService.onUserStoppedTyping((data) => {
                if (data.user.type === 'customer') {
                    this.typingUser = null;
                }
            });

            // Listen for user joined/left
            SocketService.onUserJoined((data) => {
                console.log(`👋 ${data.user.name} joined the chat`);
            });

            SocketService.onUserLeft((data) => {
                console.log(`👋 ${data.user.name} left the chat`);
            });
        },

        leaveRFQRoom() {
            SocketService.leaveRFQRoom(this.quote.id, this.customerQuote.id);
            SocketService.offNewMessage();
        },

        saveMessage: function (scope, { resetForm }) {
            this.disable_button = true;

            this.$axios.post("{{ route('b2b_marketplace.supplier.request_quote.message') }}", {
                message: this.message.newMessage,
                supplier_quote_item_id: this.supplierFirstQuote.id,
                supplier_id: this.supplierFirstQuote.supplier_id,
                customer_quote_item_id: this.customerQuote.id
            })
                .then(response => {
                    // Broadcast via Socket.IO for real-time delivery
                    SocketService.sendRFQMessage(
                        this.quote.id,
                        this.customerQuote.id,
                        response.data
                    );

                    this.$emitter.emit('add-flash', {
                        type: 'success',
                        message: response.data.message
                    });

                    this.message.newMessage = '';
                    this.disable_button = false;

                    // Stop typing indicator
                    SocketService.emitStopTyping(this.quote.id, this.customerQuote.id);

                    resetForm();
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                    this.$emitter.emit('add-flash', {
                        type: 'error',
                        message: "@lang('b2b_marketplace::app.shop.customers.account.rfq.view.chat.message-error')"
                    });
                    this.disable_button = false;
                });
        },

        handleTyping() {
            if (!this.isTyping && this.message.newMessage.length > 0) {
                this.isTyping = true;
                SocketService.emitTyping(this.quote.id, this.customerQuote.id);
            }

            // Clear previous timeout
            clearTimeout(this.typingTimeout);

            // Set new timeout to stop typing after 2 seconds
            this.typingTimeout = setTimeout(() => {
                this.isTyping = false;
                SocketService.emitStopTyping(this.quote.id, this.customerQuote.id);
            }, 2000);
        },

        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ][date.getMonth()];

            return month + '-' + date.getDate() + '-' + date.getFullYear() +
                ' ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
        },

        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.chatContainer;
                if (container) {
                    container.scrollTop = container.scrollHeight;

                    // Force scroll using scrollIntoView as backup
                    const lastMessage = container.lastElementChild;
                    if (lastMessage) {
                        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }
            });
        }
    }
};
