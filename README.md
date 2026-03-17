# AI-Powered Live Coding Interview Simulator

A full-stack application that simulates realistic coding interviews with AI coaching and real-time feedback.

## Overview

This application uses Google's Gemini Live API (via Vertex AI) to provide:
- Real-time coaching during coding interviews
- Detection when candidates are stuck
- Prompts for missing signals (time complexity, edge cases)
- Voice and on-screen feedback
- Comprehensive post-interview assessment

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │  Backend API    │     │  Vertex AI      │
│   (React +      │◄───►│  (Node.js +     │◄───►│  (Gemini)       │
│    Vite)        │     │   Express)      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│  WebSocket      │     │  Google         │
│  Service        │     │  Cloud Platform │
│  (ws)           │     │                 │
└─────────────────┘     └─────────────────┘
```

## Features

### For Candidates
- Real-time AI interviewer and coach
- Code editor with screen capture
- Voice recognition for spoken reasoning
- Instant feedback when stuck
- Prompts for important interview signals
- Comprehensive post-interview assessment

### For the System
- Real-time transcript analysis
- State detection (coding, thinking, stuck, explaining)
- Signal tracking (complexity, edge cases, testing)
- Feedback generation with Gemini API
- Session metrics and scoring

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js (REST API)
- ws (WebSocket server)
- Google Cloud Platform + Vertex AI (Gemini)

**Frontend:**
- React 18 + TypeScript
- Vite
- Zustand (state management)
- TailwindCSS
- Monaco Editor (code editor)
- Socket.io-client (WebSocket client)

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Platform account with Vertex AI enabled
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-interview-simulator
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Configure environment variables:
```bash
# Copy example file
cp .env.example .env

# Edit .env with your credentials:
# GCP_PROJECT_ID=your-gcp-project-id
# GCP_LOCATION=us-central1
# GEMINI_MODEL_NAME=gemini-1.5-flash
# GEMINI_SYSTEM_PROMPT=... (your prompt)
```

5. Set up Google Cloud:
```bash
# Authenticate
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"
```

### Development

Run both backend and frontend:
```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3002
- Frontend: http://localhost:5173

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Sessions

- `POST /api/sessions/new` - Create new interview session
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/sessions/:sessionId/end` - End session and get assessment
- `GET /api/sessions/:sessionId/transcript` - Get session transcript
- `GET /api/sessions/:sessionId/feedback` - Get feedback history

### WebSocket Messages

**Client → Server:**
- `join_session` - Join an interview session
- `audio_segment` - Send audio data/transcript
- `screen_frame` - Send screen capture data
- `code_update` - Send code changes
- `request_feedback` - Request manual feedback
- `acknowledge_feedback` - Acknowledge received feedback

**Server → Client:**
- `connected` - Connection established
- `session_joined` - Successfully joined session
- `session_update` - Session status update
- `feedback` - AI-generated feedback
- `error` - Error message

## Project Structure

```
├── src/
│   ├── server/
│   │   ├── config/
│   │   │   └── env.ts           # Environment configuration
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── services/
│   │   │   ├── vertex-ai.ts     # Gemini API integration
│   │   │   └── websocket.ts     # WebSocket handling
│   │   ├── routes/
│   │   │   └── sessions.ts      # Session endpoints
│   │   └── index.ts             # Server entry point
│   └── frontend/
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── pages/           # Page components
│       │   ├── store/           # Zustand stores
│       │   └── services/        # API/WebSocket services
│       ├── package.json
│       └── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend HTTP port | 3001 |
| `WS_PORT` | WebSocket port | 3002 |
| `GCP_PROJECT_ID` | Google Cloud project ID | Required |
| `GCP_LOCATION` | GCP location | us-central1 |
| `GEMINI_MODEL_NAME` | Gemini model to use | gemini-1.5-flash |
| `GEMINI_SYSTEM_PROMPT` | System prompt for AI | See .env.example |

## Google Cloud Setup

1. Create a GCP project
2. Enable Vertex AI API
3. Create a service account with these roles:
   - Vertex AI User
   - Vertex AI Editor
4. Generate and download a JSON key
5. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Features in Detail

### Real-time Analysis

The system continuously analyzes:
- Candidate speech patterns
- Code activity and changes
- Time spent without activity
- Discussion of key signals

### Feedback Types

1. **Coach Feedback** - General guidance and encouragement
2. **Interviewer Feedback** - Simulated interviewer questions
3. **Hint** - Specific hints when stuck
4. **Correction** - Gently correct misunderstandings

### State Detection

The AI detects when the candidate is:
- **Coding** - Actively writing code
- **Thinking** - Paused but engaged
- **Stuck** - Appears unable to proceed
- **Explaining** - Verbalizing approach
- **Silent** - No activity for extended period

## License

MIT

## Contributing

Contributions are welcome! Please submit pull requests or open issues for bugs and feature requests.
