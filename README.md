# Genie AI - Mental Health Support System

## Overview
Genie is an AI-powered mental health support system that combines a Next.js frontend with a Python backend featuring advanced RAG (Retrieval-Augmented Generation) capabilities.

## Architecture
- **Frontend**: Next.js with TypeScript, Tailwind CSS, and modern UI components
- **Backend**: Python with FastAPI, advanced RAG system, and multiple retrieval methods
- **AI Models**: Groq API integration with local model support
- **Database**: Supabase for user authentication and chat history

## Features
- 🤖 Advanced conversational AI with mental health expertise
- 🔍 RAG system with vector search, BM25, and knowledge graphs
- 🎤 Voice-to-text transcription with Whisper
- 📚 Comprehensive mental health resource database
- 🔒 Secure authentication and session management
- 💬 Real-time chat interface with typing effects
- 🌐 Fallback system for reliability

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.9+
- GROQ API key

### 1. Setup Frontend (Next.js)
```bash
# Install dependencies
npm install
# or
pnpm install

# Create environment file
cp .env.local.example .env.local
# Add your GROQ API key to .env.local
```

### 2. Setup Backend (Python)
```bash
# Navigate to backend
cd backend/ai_models

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Start the System

#### Option A: Development Mode (Recommended)
1. **Start the Python backend** (Terminal 1):
```bash
cd backend
python start_server.py
```
The backend will start at `http://127.0.0.1:8000`

2. **Start the Next.js frontend** (Terminal 2):
```bash
npm run dev
# or
pnpm dev
```
The frontend will start at `http://localhost:3000`

#### Option B: Backend Only (For testing)
```bash
cd backend/ai_models
python main.py  # CLI interface
```

### 4. Verify Integration
1. Visit `http://localhost:3000/chat`
2. Send a test message
3. Check the browser console for backend connection logs
4. The system will automatically fall back to Groq if the backend is unavailable

## Configuration

### Environment Variables
Create `.env.local` in the root directory:
```env
# Required
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
GENIE_BACKEND_URL=http://127.0.0.1:8000

# Optional Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Configuration
The backend automatically configures itself based on available resources. See `backend/ai_models/config/settings.py` for advanced configuration options.

## System Integration

### How It Works
1. **User sends message** → Next.js chat interface
2. **Frontend tries backend** → `/api/chat-backend` → Python FastAPI
3. **Backend processes** → RAG system retrieves relevant information
4. **AI generates response** → Using Groq or local models
5. **Response returns** → Through the API chain back to user
6. **Fallback system** → If backend fails, uses direct Groq integration

### API Endpoints
- `POST /api/chat-backend` - Send message to Python backend
- `GET /api/chat-backend` - Backend health check
- `POST /api/transcribe` - Voice transcription (Groq Whisper)

### Backend Endpoints (Python)
- `POST /chat` - Main chat endpoint
- `GET /health` - Health check and system info
- `GET /sessions/{id}/history` - Get conversation history
- `DELETE /sessions/{id}` - Clear session

## Development

### Frontend Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run linting
```

### Backend Development
```bash
cd backend/ai_models
python main.py --help                    # See CLI options
python main.py --test "your question"    # Test with single query
python main.py --rebuild-index           # Rebuild search indexes
python api_server.py --reload            # Start API with auto-reload
```

### Debugging
- Frontend logs: Browser console
- Backend logs: Terminal running the Python server
- API logs: Check both frontend and backend terminals
- Health check: Visit `http://127.0.0.1:8000/health`

## Troubleshooting

### Backend Connection Issues
1. **Check if backend is running**: Visit `http://127.0.0.1:8000/health`
2. **Check environment variables**: Ensure `GENIE_BACKEND_URL` is set correctly
3. **Check Python dependencies**: Run `pip install -r requirements.txt`
4. **Check GROQ API key**: Set in both frontend and backend environments

### Performance Issues
1. **First run is slower**: The system loads AI models and indexes
2. **Subsequent runs are faster**: Models and indexes are cached
3. **Rebuild indexes if needed**: Use `--rebuild-index` flag

### Common Errors
- `503 Service Unavailable`: Backend not running or crashed
- `Connection refused`: Wrong backend URL or port
- `API key errors`: Check GROQ_API_KEY environment variable
- `Import errors`: Check Python virtual environment and dependencies

## Production Deployment

### Frontend (Next.js)
Deploy to Vercel, Netlify, or similar platform with environment variables configured.

### Backend (Python)
Deploy using Docker, cloud platforms, or VPS with:
- Production WSGI server (Gunicorn + Uvicorn)
- Proper environment variable management
- Resource monitoring
- Load balancing if needed

## Contributing
1. Fork the repository
2. Create feature branch
3. Test both frontend and backend integration
4. Submit pull request

## License
MIT License - see LICENSE file for details