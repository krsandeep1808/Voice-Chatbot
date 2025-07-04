const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Get messages for a specific room
router.get('/messages/:room', async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.room })
            .sort({ timestamp: 1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save a new message
router.post('/messages', async (req, res) => {
    try {
        const { room, sender, message, messageType } = req.body;
        
        const newMessage = new Message({
            room,
            sender,
            message,
            messageType
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI-powered chatbot response system
router.post('/bot-response', async (req, res) => {
    try {
        const { message, room } = req.body;
        
        let botResponse;
        
        // Try to get AI response first, fallback to rule-based if needed
        try {
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
                botResponse = await getAIResponse(message, room);
            } else {
                throw new Error('OpenAI not configured, using enhanced fallback');
            }
        } catch (aiError) {
            console.log('Using enhanced intelligent fallback system:', aiError.message);
            botResponse = await getIntelligentResponse(message.toLowerCase(), room);
        }

        // Save bot response to database
        const botMessage = new Message({
            room,
            sender: 'ChatBot',
            message: botResponse,
            messageType: 'bot'
        });

        await botMessage.save();
        res.json({ response: botResponse, message: botMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI-powered response function using OpenAI GPT with context
async function getAIResponse(message, room = 'general') {
    try {
        // Get recent conversation history for context
        const recentMessages = await Message.find({ room: room })
            .sort({ timestamp: -1 })
            .limit(6)
            .select('sender message messageType');
        
        // Build conversation context
        const conversationHistory = recentMessages.reverse().map(msg => {
            if (msg.sender === 'ChatBot') {
                return { role: "assistant", content: msg.message };
            } else {
                return { role: "user", content: msg.message };
            }
        });
        
        // Prepare messages for OpenAI
        const messages = [
            {
                role: "system",
                content: `You are ChatBot, a friendly and helpful voice-enabled chat assistant. You should:
                - Be conversational and engaging
                - Keep responses concise but informative (1-3 sentences)
                - Be helpful and answer questions to the best of your ability
                - Show personality and be friendly
                - If you don't know something, admit it honestly
                - Encourage further conversation
                - Remember you can both receive text and voice messages
                - Be supportive and positive
                - Use the conversation history to provide contextual responses
                - Remember what was discussed earlier in the conversation`
            },
            ...conversationHistory.slice(-4), // Include last 4 messages for context
            {
                role: "user",
                content: message
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 200,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// Enhanced intelligent response system with context awareness
async function getIntelligentResponse(message, room = 'general') {
    try {
        // Get conversation context
        const recentMessages = await Message.find({ room: room })
            .sort({ timestamp: -1 })
            .limit(4)
            .select('sender message messageType');
        
        const context = recentMessages.reverse();
        const msg = message.toLowerCase().trim();
        
        // Advanced pattern matching with context
        const response = getContextualResponse(msg, context);
        return response;
    } catch (error) {
        console.error('Context response error:', error);
        return getFallbackResponse(message);
    }
}

// Advanced contextual response system
function getContextualResponse(message, context = []) {
    const msg = message.toLowerCase().trim();
    
    // Extract previous topics from context
    const previousTopics = context.map(m => m.message.toLowerCase()).join(' ');
    
    // Advanced question patterns
    if (msg.includes('what') || msg.includes('how') || msg.includes('why') || msg.includes('when') || msg.includes('where') || msg.includes('who')) {
        return getQuestionResponse(msg, previousTopics);
    }
    
    // Follow-up responses based on context
    if (previousTopics.includes('music') && (msg.includes('yes') || msg.includes('yeah') || msg.includes('sure'))) {
        return 'Great! What\'s your favorite genre or artist? I love learning about different musical tastes!';
    }
    
    if (previousTopics.includes('food') && (msg.includes('yes') || msg.includes('yeah') || msg.includes('sure'))) {
        return 'Awesome! What kind of cuisine do you enjoy most? I find food culture so fascinating!';
    }
    
    // Continue with enhanced fallback
    return getAdvancedFallbackResponse(msg);
}

// Question-specific response system
function getQuestionResponse(message, context = '') {
    const msg = message.toLowerCase();
    
    // What questions
    if (msg.includes('what')) {
        if (msg.includes('what is') || msg.includes('what are')) {
            if (msg.includes('ai') || msg.includes('artificial intelligence')) {
                return 'AI is a fascinating field! It\'s about creating computer systems that can perform tasks that typically require human intelligence, like understanding language, recognizing patterns, and making decisions.';
            }
            if (msg.includes('javascript') || msg.includes('js')) {
                return 'JavaScript is a versatile programming language! It\'s used for web development, creating interactive websites, and even building mobile apps and servers.';
            }
            if (msg.includes('react')) {
                return 'React is a popular JavaScript library for building user interfaces! It\'s what I\'m built with, actually. It makes creating interactive web applications much easier.';
            }
            if (msg.includes('love') || msg.includes('favorite')) {
                return 'That\'s a wonderful question! I\'d love to hear about what you\'re passionate about. What brings you joy?';
            }
        }
        if (msg.includes('what can') || msg.includes('what do')) {
            return 'I can chat about almost anything! I enjoy discussing technology, life experiences, hobbies, current events, or just having casual conversations. What interests you most?';
        }
        if (msg.includes('what time') || msg.includes('what\'s the time')) {
            const now = new Date();
            return `It\'s currently ${now.toLocaleTimeString()}. Are you planning something special?`;
        }
    }
    
    // How questions
    if (msg.includes('how')) {
        if (msg.includes('how are') || msg.includes('how do you')) {
            return 'I\'m doing wonderfully, thank you for asking! I\'m always excited to meet new people and have interesting conversations. How has your day been?';
        }
        if (msg.includes('how old') || msg.includes('how long')) {
            return 'I\'m quite new to the world! I was created recently to be your conversation companion. I\'m still learning and growing with each chat.';
        }
        if (msg.includes('how to') || msg.includes('how can')) {
            return 'That\'s a great question! I\'d be happy to help brainstorm or discuss approaches. Can you tell me more about what you\'re trying to accomplish?';
        }
    }
    
    // Why questions
    if (msg.includes('why')) {
        if (msg.includes('why are you') || msg.includes('why do you')) {
            return 'Great question! I exist to be a helpful conversation partner. I find genuine joy in connecting with people and learning about their perspectives and experiences.';
        }
        return 'That\'s a thoughtful question! I find it interesting to explore the \'why\' behind things. What made you curious about this?';
    }
    
    // When questions
    if (msg.includes('when')) {
        if (msg.includes('when did') || msg.includes('when was')) {
            return 'That\'s an interesting historical question! While I don\'t have access to comprehensive databases, I\'d love to discuss what you know about it or explore the topic together.';
        }
        return 'Timing questions are fascinating! Context and timing can change everything. What specifically are you curious about?';
    }
    
    // Where questions
    if (msg.includes('where')) {
        if (msg.includes('where are you') || msg.includes('where do you')) {
            return 'I exist in the digital realm, always ready to chat with you! I don\'t have a physical location, but I\'m here whenever you want to talk.';
        }
        return 'Location questions are interesting! Are you thinking about travel, geography, or something else? I\'d love to hear more!';
    }
    
    // Who questions
    if (msg.includes('who')) {
        if (msg.includes('who are you') || msg.includes('who is')) {
            return 'I\'m ChatBot, your friendly AI conversation partner! I\'m here to chat, answer questions, and hopefully brighten your day a bit. Who are you? I\'d love to get to know you better!';
        }
        return 'That\'s an intriguing question about people or identity! I find human connections and stories fascinating. What prompted this question?';
    }
    
    // Default question response
    return 'That\'s a really interesting question! I appreciate your curiosity. While I might not have all the answers, I enjoy exploring ideas together. What aspects of this topic interest you most?';
}

// Advanced fallback with many more patterns
function getAdvancedFallbackResponse(message) {
    return getFallbackResponse(message);
}

// Original fallback response function (used when AI fails)
function getFallbackResponse(message) {
    const msg = message.toLowerCase().trim();
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi ') || msg === 'hi' || msg.includes('hey')) {
        const greetings = [
            'Hello! How can I help you today?',
            'Hi there! What can I do for you?',
            'Hey! Nice to meet you!',
            'Hello! I\'m here to chat with you.'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // How are you
    if (msg.includes('how are you') || msg.includes('how do you do') || msg.includes('how\'s it going')) {
        const responses = [
            'I\'m doing great! Thanks for asking. How are you?',
            'I\'m fantastic! Ready to chat with you!',
            'I\'m doing well, thank you! How can I assist you today?'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Questions about the bot
    if (msg.includes('what can you do') || msg.includes('what do you do') || msg.includes('your capabilities')) {
        return 'I can chat with you, answer questions, and have conversations! I can understand both text and voice messages. Try asking me about various topics!';
    }
    
    // Name questions
    if (msg.includes('what is your name') || msg.includes('your name') || msg.includes('who are you')) {
        return 'I\'m ChatBot, your friendly voice-enabled chat assistant! I\'m here to have conversations with you.';
    }
    
    // Time and date
    if (msg.includes('time') || msg.includes('what time')) {
        const now = new Date();
        return `The current time is ${now.toLocaleTimeString()}.`;
    }
    
    if (msg.includes('date') || msg.includes('what date') || msg.includes('today')) {
        const now = new Date();
        return `Today is ${now.toLocaleDateString()}.`;
    }
    
    // Weather (mock response)
    if (msg.includes('weather') || msg.includes('temperature')) {
        return 'I don\'t have access to real-time weather data, but you can check your local weather app or website for current conditions!';
    }
    
    // Technology questions
    if (msg.includes('react') || msg.includes('javascript') || msg.includes('programming')) {
        return 'That\'s interesting! I\'m built with React and Node.js. Programming and technology are fascinating topics!';
    }
    
    // Help
    if (msg.includes('help') || msg.includes('assist') || msg.includes('support')) {
        return 'I\'m here to help! You can ask me questions, have a conversation, or just chat. I understand both text and voice messages. Try asking about time, my capabilities, or just say hello!';
    }
    
    // Goodbye
    if (msg.includes('bye') || msg.includes('goodbye') || msg.includes('see you') || msg.includes('farewell')) {
        const goodbyes = [
            'Goodbye! Have a wonderful day!',
            'See you later! Take care!',
            'Bye! It was great chatting with you!',
            'Farewell! Come back anytime!'
        ];
        return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    }
    
    // Thanks
    if (msg.includes('thank') || msg.includes('thanks')) {
        const thanks = [
            'You\'re welcome! Happy to help!',
            'No problem at all!',
            'Glad I could help!',
            'You\'re very welcome!'
        ];
        return thanks[Math.floor(Math.random() * thanks.length)];
    }
    
    // Questions
    if (msg.includes('?')) {
        const questionResponses = [
            'That\'s an interesting question! I\'m still learning, but I\'d love to chat about it more.',
            'Great question! While I may not have all the answers, I enjoy our conversation.',
            'I appreciate your curiosity! Let\'s explore that topic together.',
            'Good question! I\'m here to chat and learn with you.'
        ];
        return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Compliments
    if (msg.includes('good') || msg.includes('nice') || msg.includes('awesome') || msg.includes('great')) {
        const compliments = [
            'Thank you! You\'re very kind!',
            'That\'s so nice of you to say!',
            'I appreciate the kind words!',
            'You\'re awesome too!'
        ];
        return compliments[Math.floor(Math.random() * compliments.length)];
    }
    
    // Emotions and feelings
    if (msg.includes('happy') || msg.includes('joy') || msg.includes('excited')) {
        return 'That\'s wonderful! I\'m glad you\'re feeling happy. What\'s making you feel so good today?';
    }
    
    if (msg.includes('sad') || msg.includes('upset') || msg.includes('down')) {
        return 'I\'m sorry to hear that. Sometimes talking can help. I\'m here to listen if you\'d like to share.';
    }
    
    // Favorite things
    if (msg.includes('favorite') || msg.includes('like') || msg.includes('love')) {
        const favoriteResponses = [
            'That sounds great! I\'d love to hear more about what you enjoy.',
            'Interesting! Tell me more about that.',
            'That\'s awesome! What specifically do you like about it?'
        ];
        return favoriteResponses[Math.floor(Math.random() * favoriteResponses.length)];
    }
    
    // Food
    if (msg.includes('food') || msg.includes('eat') || msg.includes('hungry') || msg.includes('meal')) {
        return 'Food is such an interesting topic! I don\'t eat myself, but I love hearing about what people enjoy. What\'s your favorite cuisine?';
    }
    
    // Music
    if (msg.includes('music') || msg.includes('song') || msg.includes('listen')) {
        return 'Music is amazing! It can really affect our mood and bring people together. What kind of music do you enjoy?';
    }
    
    // Work or school
    if (msg.includes('work') || msg.includes('job') || msg.includes('school') || msg.includes('study')) {
        return 'That\'s an important part of life! How are things going with that? I\'d be happy to chat about it.';
    }
    
    // Sports
    if (msg.includes('sport') || msg.includes('game') || msg.includes('play') || msg.includes('team')) {
        return 'Sports and games can be so much fun! Are you a player or more of a fan? I\'d love to hear about your interests.';
    }
    
    // Travel
    if (msg.includes('travel') || msg.includes('trip') || msg.includes('vacation') || msg.includes('visit')) {
        return 'Travel sounds exciting! I love hearing about different places and experiences. Where are you thinking of going or where have you been?';
    }
    
    // Books and movies
    if (msg.includes('book') || msg.includes('read') || msg.includes('movie') || msg.includes('watch')) {
        return 'Books and movies are such great ways to experience stories! I\'d love to hear about what you\'ve been reading or watching lately.';
    }
    
    // Simple responses for short messages
    if (msg.length <= 3) {
        const shortResponses = [
            'Tell me more!',
            'Go on...',
            'Interesting!',
            'What else?',
            'I\'m listening!'
        ];
        return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }
    
    // General conversation starters
    const conversationStarters = [
        'That\'s interesting! Tell me more about that.',
        'I hear you! What else is on your mind?',
        'Thanks for sharing! I enjoy our conversation.',
        'I\'m listening! Feel free to tell me more.',
        'That sounds intriguing! What would you like to talk about next?',
        'I appreciate you chatting with me! What else would you like to discuss?',
        'I find that fascinating! Can you elaborate?',
        'That\'s a great point! What do you think about it?',
        'I\'m curious to learn more about your perspective on that!'
    ];
    
    return conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
}

// Health check endpoint to verify OpenAI integration
router.get('/health', async (req, res) => {
    try {
        const hasApiKey = !!process.env.OPENAI_API_KEY;
        res.json({
            status: 'healthy',
            openaiConfigured: hasApiKey,
            features: {
                aiResponses: hasApiKey,
                fallbackResponses: true,
                voiceChat: true,
                messageStorage: true
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
