# Orbit - AI-Powered Adaptive Learning Platform

Orbit is an intelligent learning platform that transforms uploaded study materials into interactive, adaptive lessons with AI-generated content, simulations, and questions.

## 🚀 Current Features

### ✅ Document Processing & Curriculum Generation
- Upload PDF, DOCX, and other document formats
- Automatic curriculum extraction using Unstructured API
- Hierarchical content organization: **Curriculums → Modules → Subtopics**
- Each upload creates a separate curriculum
- Content decomposition into structured learning units

### ✅ AI-Powered Teaching Content
- **Dual AI Model System**:
  - Primary: Gemini 3 Flash Preview
  - Fallback: Gemini 2.5 Flash (when quota exhausted)
- **Automatic API Key Rotation**: Handles multiple API keys with 429 error detection
- **Adaptive Content Generation**: Adjusts difficulty based on learner score (0-100)
- **Content Types**:
  - Paragraphs (explanatory text)
  - Formulas (mathematical equations with explanations)
  - Insights (key takeaways)
  - Lists (structured information)
  - **Interactive HTML Simulations** (with inline CSS/JS)
  - Questions (MCQ and fill-in-blank)

### ✅ Interactive Simulations
- AI-generated HTML/CSS/JavaScript simulations
- Proper script execution in React using custom `SimulationBlock` component
- Real-time interactive visualizations
- Stored in database for caching

### ✅ Question & Scoring System
- **Client-Side Attempt Tracking**
- **Smart Feedback System**:
  - Hints on wrong answers (attempts 1-3)
  - Full explanation on 4th attempt or correct answer
- **Automatic Scoring**:
  - 1st attempt: 1.0 (100%)
  - 2nd attempt: 0.75 (75%)
  - 3rd attempt: 0.5 (50%)
  - 4th+ attempt: 0.25 (25%)
- Score calculation happens client-side, sent to backend when all questions complete
- Subtopic score = average of all question scores (0-100 scale)
- Auto-continue after correct answers (300ms delay)

### ✅ Curriculum Management
- **Database Schema**:
  ```
  users → curriculums → modules → subtopics
  ```
- Multiple curriculums per user
- Progress tracking per subtopic
- Score persistence in `subtopics.score`

### ✅ Content Caching
- Teaching blocks cached in `teaching_blocks` table (PostgreSQL JSONB)
- Prevents redundant AI API calls
- Instant content loading on revisits

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon DB)
- **ORM**: SQLAlchemy (raw SQL for performance)
- **AI Services**:
  - Google Gemini API (3-flash-preview, 2.5-flash)
  - Unstructured API (document parsing)
- **Validation**: Pydantic
- **Environment**: python-dotenv

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: @tanstack/react-query (for server state)
- **Animations**: Framer Motion
- **Styling**: CSS (custom design system)
- **Icons**: Lucide React
- **UI Utilities**: Custom component library

### Infrastructure
- **CORS**: Enabled for development
- **API Architecture**: RESTful
- **Caching Strategy**: Server-side (PostgreSQL) + Client-side (React Query)

## 📁 Project Structure

```
Orbit/
├── backend/
│   ├── routes/               # API endpoints
│   │   ├── parse.py         # Document upload & parsing
│   │   ├── curriculum.py    # Curriculum fetching
│   │   ├── teaching.py      # Teaching content generation
│   │   ├── attempts.py      # Score updates
│   │   └── users.py         # User management
│   ├── services/
│   │   ├── Gemini_Services/ # AI content generation
│   │   │   ├── gemini_service.py      # Main generation logic
│   │   │   ├── key_manager.py         # API key rotation
│   │   │   └── teaching_prompt.py     # Prompts
│   │   ├── db_services/     # Database operations
│   │   │   ├── db.py        # Session management
│   │   │   └── push_to_db.py # Curriculum upload
│   │   ├── unstructured_service.py  # Document parsing
│   │   └── manual_parsing.py        # Content extraction
│   ├── config.py            # Environment config
│   ├── main.py              # FastAPI app
│   └── .env                 # API keys (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── teaching/    # Teaching content components
│   │   │   │   ├── TeachingCanvas.tsx    # Main content display
│   │   │   │   ├── QuestionBlock.tsx     # Interactive questions
│   │   │   │   ├── SimulationBlock.tsx   # HTML simulations
│   │   │   │   └── AskAIChat.tsx         # AI chat feature
│   │   │   ├── curriculum/  # Curriculum navigation
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities & API client
│   │   ├── logic/           # Business logic
│   │   └── types/           # TypeScript definitions
│   └── index.html
│
└── README.md (this file)
```

## 🔑 Key Implementation Details

### API Key Rotation System
- Loads keys from environment: `GEMINI_API_KEY_1`, `_2`, `_3`...
- Circular rotation on 429 errors
- Tries each key once per request
- Fails gracefully after exhausting all keys

### Simulation Rendering
- React's `dangerouslySetInnerHTML` blocks `<script>` execution
- **Solution**: Custom `useEffect` hook that:
  1. Sets HTML via `innerHTML`
  2. Extracts all `<script>` tags
  3. Creates new script elements to execute them
  4. Properly cleans up on unmount

### Score Calculation Flow
1. User answers question → Client tracks attempts
2. On correct answer → Calculate score based on attempt count
3. When all questions complete → Calculate average
4. Send final score to backend → Update `subtopics.score`

### Content Generation Pipeline
1. User selects subtopic
2. Backend checks cache (`teaching_blocks` table)
3. If not cached:
   - Fetch subtopic content + nearby context
   - Call Gemini with adaptive prompt
   - Parse response into structured blocks
   - Cache in database
4. Return blocks to frontend

### Voice Mode Implementation
- **Architecture**: Hybrid Approach
  - **Speech Recognition**: Uses browser-native **Web Speech API** (Chrome/Edge recommended) for zero-latency, offline-capable command detection.
  - **Text-to-Speech**: Uses backend **Piper TTS** for high-quality, consistent voice generation.
  - **Caching**: Multi-level caching (browser cache + in-memory) for instant playback of common phrases.
- **Features**:
  - Push-to-Talk (Hold Control)
  - Smart Prefetching (loads next section's audio in background)
  - Automatic Speech Queueing (prevents overlapping audio)
  - Cross-browser graceful degradation (warns on unsupported browsers)

## 📚 Documentation

- `README_TDT.md` - Technical design document
- `FEATURE_ORDER.md` - Feature implementation roadmap
- `DOCS_OVERVIEW.md` - Documentation guide
- `PROGRESS.md` - Development progress tracker

## 🐛 Known Issues

None currently! 🎉

## 🔮 Next Steps

See `FEATURE_ORDER.md` for the complete roadmap. Priority features:
1. Camera-based engagement tracking
2. Module unlocking system
3. Skip subtopic feature
4. Advanced analytics
5. Production deployment

## 📄 License

Private project - All rights reserved

---

Built with ❤️ using AI-powered learning technology
