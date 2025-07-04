# Voice Chat Bot

A real-time voice chat bot application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring speech recognition, text-to-speech, and real-time messaging.

## Features

- 🎤 **Voice Recognition**: Speak your messages using Web Speech API
- 🔊 **Text-to-Speech**: Bot responses are spoken aloud
- 💬 **Real-time Chat**: Instant messaging using Socket.IO
- 🤖 **Chat Bot**: Simple AI responses (can be enhanced with OpenAI)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💾 **Message Persistence**: Chat history stored in MongoDB

## Technology Stack

- **Frontend**: React.js, Socket.IO Client, Web Speech API
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO
- **Voice Features**: Web Speech API, Speech Synthesis API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Modern web browser with microphone access

## Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd voice-chat-bot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
````
#### create .env file in backend directory and fill the open api key and mongodb conection string
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voice-chatbot
OPENAI_API_KEY= enter you api key
```

```bash
# Start the backend server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# For local MongoDB installation
mongod
```

Or update the `.env` file in the backend directory with your MongoDB Atlas connection string.

## Usage

1. **Start the Application**:
   - Ensure MongoDB is running
   - Start the backend server: `npm run dev` (in backend directory)
   - Start the frontend: `npm start` (in frontend directory)

2. **Join the Chat**:
   - Open `http://localhost:3000` in your browser
   - Enter your name and click "Join Chat"

3. **Chat Features**:
   - **Type Messages**: Use the text input to type messages
   - **Voice Messages**: Click the microphone button (🎤) and speak
   - **Bot Responses**: The bot will respond to your messages automatically
   - **Voice Playback**: Bot responses will be spoken aloud

4. **Voice Commands**:
   - Say "hello" or "hi" for greetings
   - Say "how are you" for status check
   - Say "help" for assistance
   - Say "bye" to say goodbye

## File Structure

```
voice-chat-bot/
├── backend/
│   ├── models/
│   │   └── Message.js          # MongoDB message schema
│   ├── routes/
│   │   └── chat.js             # Chat API routes
│   ├── .env                    # Environment variables
│   ├── server.js               # Main server file
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── App.css             # Styles
│   │   └── index.js            # React entry point
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/chat/messages/:room` - Get messages for a room
- `POST /api/chat/messages` - Save a new message
- `POST /api/chat/bot-response` - Get bot response for a message

## Socket.IO Events

- `join-room` - Join a chat room
- `text-message` - Send/receive text messages
- `voice-message` - Send/receive voice messages

## Customization

### Enhancing the Chat Bot

To integrate with OpenAI GPT for better responses:

1. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_api_key_here
```

2. Update the bot response logic in `backend/routes/chat.js`

### Adding More Voice Features

- Implement voice message recording and playback
- Add voice commands for specific actions
- Customize speech synthesis voices and rates

### Styling

Modify `frontend/src/App.css` to customize the appearance:
- Colors and themes
- Message bubble styles
- Animations and transitions

## Browser Compatibility

- **Speech Recognition**: Chrome, Edge, Safari (with webkit prefix)
- **Speech Synthesis**: All modern browsers
- **Socket.IO**: All modern browsers

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**:
   - Ensure HTTPS or localhost
   - Check browser permissions

2. **MongoDB Connection Error**:
   - Verify MongoDB is running
   - Check connection string in `.env`

3. **Socket.IO Connection Issues**:
   - Ensure backend server is running on port 5000
   - Check CORS settings

4. **Voice Features Not Working**:
   - Use Chrome or Edge browser
   - Ensure microphone permissions are granted

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `frontend/src/`
3. **Database**: Extend models in `backend/models/`

### Testing

- Test voice features in supported browsers
- Test real-time messaging with multiple browser tabs
- Verify message persistence in MongoDB

## License

This project is open source and available under the MIT License.

