# Genie AI - Intelligent Mental Health Companion

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)

*A sophisticated AI-powered mental health support system combining advanced RAG capabilities with empathetic conversational AI*

[🚀 Quick Start](#quick-start) • [🏗️ Architecture](#architecture) • [✨ Features](#features) • [🔧 Setup](#setup) • [📚 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## 🌟 Overview

Genie AI is a comprehensive mental health support system that leverages cutting-edge AI technology to provide empathetic, intelligent, and personalized assistance. Built with a modern Next.js frontend and a sophisticated Python backend featuring advanced RAG (Retrieval-Augmented Generation) capabilities, Genie offers a seamless experience for users seeking mental health guidance and support.

### 🎯 Mission
To provide accessible, intelligent, and empathetic mental health support through AI technology, helping users navigate life's challenges with understanding and care.

---

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 15.2.4 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Library**: Radix UI primitives with custom design system
- **State Management**: React Context + Custom hooks
- **Authentication**: Supabase Auth
- **Real-time Features**: WebSocket integration
- **3D Graphics**: Three.js with React Three Fiber

### Backend Stack
- **Framework**: FastAPI with Python 3.9+
- **AI Models**: Groq API + Local LLaMA models
- **RAG System**: Multi-method retrieval (Vector, BM25, Graph, Web)
- **Embeddings**: Sentence Transformers (BAAI/bge-large-en-v1.5)
- **Vector Store**: FAISS with optimized indexing
- **Knowledge Graph**: NetworkX-based entity relationships
- **Caching**: Redis-compatible with TTL support

### AI Components
- **Orchestrator Agent**: Coordinates multi-agent system
- **Retrieval Agent**: Multi-method information retrieval
- **Synthesis Agent**: Response generation and refinement
- **Verifier Agent**: Fact-checking and confidence scoring
- **Query Agent**: Intent understanding and routing

---

## ✨ Features

### 🤖 Advanced AI Capabilities
- **Multi-Agent RAG System**: Sophisticated retrieval and synthesis
- **Emotion Recognition**: Audio-based emotion detection
- **Voice Interaction**: Speech-to-text with Whisper integration
- **Contextual Memory**: Long-term conversation memory
- **Personalization**: User-specific adaptation and learning

### 🔍 Intelligent Information Retrieval
- **Vector Search**: Semantic similarity with FAISS
- **BM25 Search**: Keyword-based retrieval
- **Knowledge Graph**: Entity relationship exploration
- **Web Search**: Real-time information gathering
- **Hybrid Retrieval**: Multi-method result fusion

### 💬 Conversational Excellence
- **Empathetic Responses**: Emotion-aware communication
- **Citation System**: Transparent source attribution
- **Confidence Scoring**: Quality assessment for responses
- **Fallback Mechanisms**: Robust error handling
- **Multi-modal Support**: Text, voice, and visual interaction

### 🛡️ Safety & Privacy
- **Content Moderation**: Safety filtering and validation
- **Privacy Protection**: Secure data handling
- **Professional Disclaimers**: Appropriate medical disclaimers
- **Crisis Detection**: Emergency situation recognition
- **Secure Authentication**: Supabase-based user management

### 📊 Wellness Tracking
- **Emotion Tracking**: Mood and emotional state monitoring
- **Progress Analytics**: User journey visualization
- **Resource Library**: Curated mental health resources
- **Safety Planning**: Crisis intervention tools
- **Meditation Features**: Guided mindfulness sessions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/pnpm
- **Python** 3.9+ with pip
- **GROQ API Key** (free tier available)
- **8GB+ RAM** (16GB+ recommended)
- **SSD Storage** (for optimal performance)

### 1. Clone & Setup
```bash
# Clone the repository
git clone <repository-url>
cd genie

# Install frontend dependencies
npm install
# or
pnpm install

# Setup environment
cp .env.local.example .env.local
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend/ai_models

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Fast Setup (Recommended)
```bash
# Run optimized setup for maximum performance
python fast_setup.py
# or on Windows
fast_setup.bat
```

### 4. Start the System
```bash
# Terminal 1: Start backend
cd backend
python start_server.py

# Terminal 2: Start frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **Health Check**: http://127.0.0.1:8000/health

---

## 🔧 Configuration

### Environment Variables
Create `.env.local` in the root directory:

```env
# Required
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
GENIE_BACKEND_URL=http://127.0.0.1:8000

# Optional Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Local model settings
LOCAL_MODEL_PATH=./model/llama1b-qlora-mh
USE_LOCAL_MODELS=false
```

### Backend Configuration
Advanced settings in `backend/ai_models/config/settings.py`:

```python
# Performance optimization
max_workers = 20  # Auto-adjusted to CPU cores
batch_size = 1024  # Optimized for parallel processing
gpu_memory_fraction = 0.85  # GPU utilization

# RAG settings
vector_top_k = 30
bm25_top_k = 20
final_top_k = 20
```

---

## 📚 Documentation

### System Architecture
```
Genie AI System
├── Frontend (Next.js)
│   ├── Chat Interface
│   ├── Dashboard & Analytics
│   ├── Wellness Tracking
│   └── Resource Library
├── Backend (Python/FastAPI)
│   ├── Multi-Agent RAG System
│   ├── Emotion Recognition
│   ├── Voice Processing
│   └── Knowledge Management
└── AI Models
    ├── Groq API (Primary)
    ├── Local LLaMA Models
    └── Embedding Models
```

### API Endpoints

#### Frontend APIs
- `POST /api/chat-backend` - Send message to Python backend
- `POST /api/transcribe` - Voice transcription
- `GET /api/chats` - Retrieve chat history
- `POST /api/chat-summary` - Generate conversation summaries

#### Backend APIs
- `POST /chat` - Main chat endpoint
- `GET /health` - System health and info
- `GET /sessions/{id}/history` - Session history
- `DELETE /sessions/{id}` - Clear session

### Development Commands

#### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Code linting
npm run start      # Production server
```

#### Backend
```bash
# CLI Interface
python main.py --help
python main.py --test "your question"
python main.py --rebuild-index

# API Server
python api_server.py --reload
python start_server.py

# Testing
python test_companion.py
python test_models.py
```

---

## 🎯 Use Cases

### Mental Health Support
- **Emotional Support**: Empathetic responses to difficult situations
- **Crisis Intervention**: Safety planning and emergency resources
- **Wellness Guidance**: Mindfulness and self-care recommendations
- **Progress Tracking**: Emotional state and improvement monitoring

### Educational Resources
- **Mental Health Education**: Evidence-based information
- **Coping Strategies**: Practical techniques and tools
- **Professional Referrals**: When to seek professional help
- **Community Resources**: Local and online support networks

### Personal Development
- **Goal Setting**: Mental health and personal growth objectives
- **Habit Formation**: Building healthy routines
- **Stress Management**: Coping with daily challenges
- **Self-Reflection**: Guided introspection and awareness

---

## 🔍 Advanced Features

### Multi-Agent RAG System
The system employs a sophisticated multi-agent architecture:

1. **Query Agent**: Understands user intent and context
2. **Retrieval Agent**: Multi-method information gathering
3. **Synthesis Agent**: Response generation and refinement
4. **Verifier Agent**: Fact-checking and confidence assessment
5. **Orchestrator Agent**: Coordinates the entire process

### Performance Optimizations
- **CPU Optimization**: Multi-core parallel processing
- **Memory Management**: Efficient caching and indexing
- **Response Streaming**: Real-time response generation
- **Batch Processing**: Optimized for large datasets

### Quality Assurance
- **Confidence Scoring**: Response quality assessment
- **Citation System**: Transparent source attribution
- **Fact Verification**: Multi-source validation
- **Content Moderation**: Safety and appropriateness filtering

---

## 🛠️ Development

### Project Structure
```
genie/
├── app/                    # Next.js frontend
│   ├── api/               # API routes
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Analytics & tracking
│   └── components/        # UI components
├── backend/               # Python backend
│   ├── ai_models/        # AI system core
│   │   ├── agents/       # Multi-agent system
│   │   ├── config/       # Configuration
│   │   ├── core/         # Core functionality
│   │   └── retrieval/    # RAG components
│   └── data/             # Data processing
├── components/            # Shared UI components
├── lib/                   # Utilities and services
└── public/               # Static assets
```

### Contributing Guidelines
1. **Fork** the repository
2. **Create** a feature branch
3. **Test** both frontend and backend integration
4. **Submit** a pull request with detailed description

### Code Standards
- **TypeScript**: Strict type checking
- **Python**: PEP 8 compliance
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear docstrings and comments

---

## 🚀 Deployment

### Frontend Deployment
Deploy to Vercel, Netlify, or similar platforms:

```bash
# Build for production
npm run build

# Deploy with environment variables
NEXT_PUBLIC_GROQ_API_KEY=your_key
GENIE_BACKEND_URL=your_backend_url
```

### Backend Deployment
Options for Python backend deployment:

#### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "api_server.py"]
```

#### Cloud Deployment
- **AWS**: EC2 with load balancer
- **Google Cloud**: App Engine or Compute Engine
- **Azure**: App Service or Virtual Machines
- **Heroku**: Container deployment

### Production Considerations
- **Environment Variables**: Secure configuration management
- **Monitoring**: Health checks and performance metrics
- **Scaling**: Load balancing and auto-scaling
- **Security**: HTTPS, authentication, and data protection

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports**: Help identify and fix issues
- 💡 **Feature Requests**: Suggest new capabilities
- 📚 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Enhance test coverage
- 🔧 **Code**: Implement features and optimizations

### Development Setup
1. Follow the [Quick Start](#quick-start) guide
2. Set up development environment
3. Create feature branch
4. Make changes and test thoroughly
5. Submit pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq**: For providing fast and reliable AI inference
- **Supabase**: For authentication and database services
- **Next.js Team**: For the excellent React framework
- **FastAPI**: For the modern Python web framework
- **Open Source Community**: For the amazing tools and libraries

---

<div align="center">

**Made with ❤️ for mental health support**

*Genie AI - Your intelligent companion for mental wellness*

</div>
