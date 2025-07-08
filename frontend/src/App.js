import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

const socket = io(API_URL);

function App() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [userName, setUserName] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [room] = useState('general');
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const handleSendVoiceMessage = useCallback(async (message) => {
        if (!message.trim()) return;

        setIsProcessingVoice(true);
        console.log('🎤 Voice message received:', message);

        const messageData = {
            room,
            sender: userName,
            message: message.trim(),
            messageType: 'voice',
            timestamp: new Date()
        };

        try {
            console.log('📤 Sending voice message to server...');
            
            // Save message to database
            await axios.post(`${API_URL}/api/chat/messages`, messageData);
            
            // Emit to socket
            socket.emit('voice-message', messageData);
            
            // Add to local messages
            setMessages(prev => [...prev, messageData]);
            
            console.log('🤖 Getting bot response...');
            // Get bot response
            const botResponse = await axios.post(`${API_URL}/api/chat/bot-response`, {
                message: message.trim(),
                room
            });

            const botMessage = {
                room,
                sender: 'ChatBot',
                message: botResponse.data.response,
                messageType: 'bot',
                timestamp: new Date()
            };

            // Add bot message to local messages
            setMessages(prev => [...prev, botMessage]);
            
            console.log('🔊 Speaking bot response...');
            // Speak bot response
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(botResponse.data.response);
                utterance.rate = 0.8;
                utterance.pitch = 1;
                utterance.volume = 0.8;
                speechSynthesis.speak(utterance);
            }
            
            console.log('✅ Voice message processing complete!');
            
        } catch (error) {
            console.error('❌ Error sending voice message:', error);
            alert('Error processing voice message. Please try again.');
        } finally {
            setIsProcessingVoice(false);
        }
    }, [room, userName]);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Changed to false for better control
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onstart = () => {
                console.log('🎤 Speech recognition started');
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event) => {
                console.log('🎤 Speech recognition result:', event);
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    console.log('✅ Final transcript received:', finalTranscript);
                    // Clear input field first
                    setInputMessage('');
                    setIsListening(false);
                    // Send voice message immediately - NO ENTER REQUIRED
                    console.log('📤 About to send voice message...');
                    setTimeout(() => {
                        handleSendVoiceMessage(finalTranscript.trim());
                    }, 100); // Small delay to ensure state updates
                } else if (interimTranscript) {
                    // Show interim results in input field while speaking
                    setInputMessage(interimTranscript.trim());
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                setIsListening(false);
                alert(`Speech recognition error: ${event.error}. Please check microphone permissions.`);
            };

            recognitionRef.current.onend = () => {
                console.log('🛑 Speech recognition ended');
                setIsListening(false);
            };
        } else {
            console.warn('⚠️ Speech recognition not supported in this browser');
        }
    }, [handleSendVoiceMessage]);

    useEffect(() => {
        if (isJoined) {
            socket.emit('join-room', room);
            loadMessages();
        }
    }, [isJoined, room]);

    useEffect(() => {
        socket.on('text-message', (data) => {
            setMessages(prev => [...prev, data]);
        });

        socket.on('voice-message', (data) => {
            setMessages(prev => [...prev, data]);
            speakMessage(data.message);
        });

        return () => {
            socket.off('text-message');
            socket.off('voice-message');
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/chat/messages/${room}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSendMessage = async (message = inputMessage) => {
        if (!message.trim()) return;

        const messageData = {
            room,
            sender: userName,
            message: message.trim(),
            messageType: 'text',
            timestamp: new Date()
        };

        try {
            // Save message to database
            await axios.post(`${API_URL}/api/chat/messages`, messageData);
            
            // Emit to socket
            socket.emit('text-message', messageData);
            
            // Add to local messages
            setMessages(prev => [...prev, messageData]);
            
            // Get bot response
            const botResponse = await axios.post(`${API_URL}/api/chat/bot-response`, {
                message: message.trim(),
                room
            });

            const botMessage = {
                room,
                sender: 'ChatBot',
                message: botResponse.data.response,
                messageType: 'bot',
                timestamp: new Date()
            };

            // Add bot message to local messages
            setMessages(prev => [...prev, botMessage]);
            
            // Speak bot response
            speakMessage(botResponse.data.response);
            
        } catch (error) {
            console.error('Error sending message:', error);
        }

        setInputMessage('');
    };


    const speakMessage = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }
    };

    const startListening = async () => {
        if (recognitionRef.current && !isListening) {
            try {
                // Check microphone permissions
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                
                console.log('Starting speech recognition...');
                setIsListening(true);
                recognitionRef.current.start();
            } catch (error) {
                console.error('Microphone access error:', error);
                alert('Microphone access denied. Please allow microphone access and try again.');
                setIsListening(false);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleJoinChat = () => {
        if (userName.trim()) {
            setIsJoined(true);
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    if (!isJoined) {
        return (
            <div className="login-container">
                <div className="login-form">
                    <h2>Join Voice Chat</h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleJoinChat()}
                    />
                    <button onClick={handleJoinChat}>Join Chat</button>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <div className="chat-header">
                <h1>Voice Chat Bot</h1>
                <p>Welcome, {userName}! You can type or speak your messages.</p>
            </div>
            
            <div className="messages-container">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.sender === userName ? 'own-message' : 'other-message'} ${message.messageType === 'bot' ? 'bot-message' : ''} ${message.messageType === 'voice' ? 'voice-message' : ''}`}
                    >
                        <div className="message-header">
                            <span className="sender">{message.sender}</span>
                            <span className="time">{formatTime(message.timestamp)}</span>
                        </div>
                        <div className="message-content">{message.message}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
                <input
                    type="text"
                    placeholder={isListening ? "Listening... speak now!" : "Type your message..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isListening}
                />
                <button onClick={() => handleSendMessage()} disabled={isListening}>Send</button>
                <button
                    className={`voice-button ${isListening ? 'listening' : ''}`}
                    onClick={isListening ? stopListening : startListening}
                    title={isListening ? "Stop recording" : "Start voice recording"}
                >
                    {isListening ? '🛑' : '🎤'}
                </button>
                {isListening && (
                    <div className="voice-status">
                        <span>🎤 Listening...</span>
                    </div>
                )}
                {isProcessingVoice && (
                    <div className="voice-status processing">
                        <span>⚙️ Processing voice...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
