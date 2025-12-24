/**
 * Example: Quote Response Detail Screen with Real-Time Messages
 * 
 * This screen shows quote details with tabs for:
 * - Quote Details
 * - Messages (with real-time Socket.IO)
 * 
 * Socket.IO connection is established when this screen opens
 * and disconnected when the user leaves.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import SocketService from '../services/socket.service';
import { useAuth } from '../hooks/useAuth';

interface Message {
    id: number;
    text: string;
    sender: {
        id: number;
        name: string;
        type: string;
    };
    timestamp: string;
}

const QuoteResponseDetailScreen = ({ route, navigation }) => {
    // Get quote details from navigation params
    const { quoteId, customerQuoteId, supplierQuoteId } = route.params;
    const { user, token } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'messages'
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);

    // Connect to Socket.IO when screen mounts
    useEffect(() => {
        console.log('📱 Quote Response Detail screen opened');

        // Connect to Socket.IO server
        SocketService.connect(token, 'customer');

        // Cleanup when screen unmounts
        return () => {
            console.log('📱 Leaving Quote Response Detail screen');

            // Leave RFQ room if joined
            if (activeTab === 'messages') {
                SocketService.leaveRFQRoom(quoteId, customerQuoteId);
            }

            // Disconnect from Socket.IO
            SocketService.disconnect();
        };
    }, [token]);

    // Join/leave RFQ room when Messages tab is activated/deactivated
    useEffect(() => {
        if (activeTab === 'messages') {
            console.log('💬 Messages tab activated - joining RFQ room');

            // Join RFQ room
            SocketService.joinRFQRoom(quoteId, customerQuoteId);

            // Listen for new messages
            SocketService.onNewMessage((data) => {
                console.log('📨 New message received:', data);

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: data.message.message,
                    sender: data.sender,
                    timestamp: data.timestamp,
                }]);
            });

            // Listen for typing indicators
            SocketService.onUserTyping((data) => {
                if (data.user.type === 'supplier') {
                    setTypingUser(data.user.name);
                }
            });

            SocketService.onUserStoppedTyping((data) => {
                if (data.user.type === 'supplier') {
                    setTypingUser(null);
                }
            });

            // Listen for user joined/left
            SocketService.onUserJoined((data) => {
                console.log(`👋 ${data.user.name} joined the chat`);
            });

            SocketService.onUserLeft((data) => {
                console.log(`👋 ${data.user.name} left the chat`);
            });

        } else {
            // Leave RFQ room when switching away from Messages tab
            console.log('💬 Messages tab deactivated - leaving RFQ room');
            SocketService.leaveRFQRoom(quoteId, customerQuoteId);
            SocketService.offNewMessage();
        }

        return () => {
            // Cleanup listeners when tab changes
            SocketService.offNewMessage();
        };
    }, [activeTab, quoteId, customerQuoteId]);

    // Handle sending message
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            // 1. Save message to database via API
            const response = await fetch('http://localhost:8000/api/rfq/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    quote_id: quoteId,
                    customer_quote_item_id: customerQuoteId,
                    supplier_quote_item_id: supplierQuoteId,
                    message: newMessage,
                }),
            });

            const data = await response.json();

            // 2. Broadcast via Socket.IO for real-time delivery
            SocketService.sendRFQMessage(quoteId, customerQuoteId, data);

            // 3. Clear input
            setNewMessage('');

            // 4. Stop typing indicator
            SocketService.emitStopTyping(quoteId, customerQuoteId);

        } catch (error) {
            console.error('Error sending message:', error);
            // Show error toast
        }
    };

    // Handle typing
    const handleTextChange = (text: string) => {
        setNewMessage(text);

        // Emit typing indicator
        if (!isTyping && text.length > 0) {
            setIsTyping(true);
            SocketService.emitTyping(quoteId, customerQuoteId);
        }

        // Clear typing indicator after 2 seconds of no typing
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setIsTyping(false);
            SocketService.emitStopTyping(quoteId, customerQuoteId);
        }, 2000);
    };

    let typingTimeout: NodeJS.Timeout;

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ padding: 16, backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Quote #{quoteId}
                </Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' }}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        padding: 16,
                        borderBottomWidth: activeTab === 'details' ? 2 : 0,
                        borderColor: '#007AFF',
                    }}
                    onPress={() => setActiveTab('details')}
                >
                    <Text style={{ textAlign: 'center', fontWeight: activeTab === 'details' ? 'bold' : 'normal' }}>
                        Quote Details
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flex: 1,
                        padding: 16,
                        borderBottomWidth: activeTab === 'messages' ? 2 : 0,
                        borderColor: '#007AFF',
                    }}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={{ textAlign: 'center', fontWeight: activeTab === 'messages' ? 'bold' : 'normal' }}>
                        Messages
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'details' ? (
                // Quote Details Tab
                <View style={{ flex: 1, padding: 16 }}>
                    <Text>Quote details go here...</Text>
                </View>
            ) : (
                // Messages Tab with Real-Time Chat
                <View style={{ flex: 1 }}>
                    {/* Messages List */}
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View
                                style={{
                                    padding: 12,
                                    marginVertical: 4,
                                    marginHorizontal: 8,
                                    backgroundColor: item.sender.type === 'customer' ? '#E3F2FD' : '#F5F5F5',
                                    borderRadius: 8,
                                    alignSelf: item.sender.type === 'customer' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                }}
                            >
                                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                    {item.sender.name}
                                </Text>
                                <Text>{item.text}</Text>
                                <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                        )}
                        contentContainerStyle={{ paddingVertical: 8 }}
                    />

                    {/* Typing Indicator */}
                    {typingUser && (
                        <View style={{ padding: 8, paddingHorizontal: 16 }}>
                            <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                                {typingUser} is typing...
                            </Text>
                        </View>
                    )}

                    {/* Message Input */}
                    <View
                        style={{
                            flexDirection: 'row',
                            padding: 8,
                            borderTopWidth: 1,
                            borderColor: '#ddd',
                            backgroundColor: '#fff',
                        }}
                    >
                        <TextInput
                            style={{
                                flex: 1,
                                padding: 12,
                                backgroundColor: '#F5F5F5',
                                borderRadius: 20,
                                marginRight: 8,
                            }}
                            placeholder="Type a message..."
                            value={newMessage}
                            onChangeText={handleTextChange}
                            multiline
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#007AFF',
                                borderRadius: 20,
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                justifyContent: 'center',
                            }}
                            onPress={handleSendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default QuoteResponseDetailScreen;
