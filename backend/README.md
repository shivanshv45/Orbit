# Orbit Backend

FastAPI-based backend for the Orbit adaptive learning platform.

## 🚀 Features

### Core Functionality
- **Document Processing**: Upload and parse PDFs, DOCX, and other formats via Unstructured API
- **Curriculum Generation**: Automatic content extraction and hierarchical organization
- **AI Content Generation**: Adaptive teaching content using Google Gemini API
- **Caching System**: PostgreSQL JSONB-based content caching
- **Score Management**: Client-calculated scores stored per subtopic

### AI Integration
- **Dual Model System**:
  - Primary: `gemini-3-flash-preview`
  - Fallback: `gemini-2.5-flash`
- **API Key Rotation**: Automatic failover on quota exhaustion
- **Adaptive Content**: Difficulty adjusts based on learner performance (0-100 score)

### Content Types Generated
1. **Paragraphs** - Explanatory text
2. **Formulas** - Mathematical equations with explanations
3. **Insights** - Key takeaways
4. **Lists** - Structured information
5. **Simulations** - Interactive HTML/CSS/JS visualizations
6. **Questions** - MCQ and fill-in-blank with hints and explanations

## 🛠️ Tech Stack

### Core
- **Python 3.12**
- **FastAPI** - Modern async web framework
- **Uvicorn** - ASGI server
- **PostgreSQL** - Database (Neon DB)
- **SQLAlchemy** - Database toolkit
- **Pydantic** - Data validation

### External APIs
- **Google Gemini API** - AI content generation
- **Unstructured API** - Document parsing

### Key Libraries
```python
fastapi==0.115.12
uvicorn==0.34.0
sqlalchemy==2.0.37
psycopg2-binary==2.9.10
pydantic==2.10.6
pydantic-settings==2.7.1
python-dotenv==1.0.1
google-genai==1.9.0
unstructured-client==0.29.2
```

## 📁 Project Structure

```
backend/
├── routes/                    # API endpoints
│   ├── parse.py              # POST /parse - Upload documents
│   ├── curriculum.py         # GET /api/curriculum - Fetch curriculum
│   ├── teaching.py           # GET /api/teaching/{id} - Get teaching content
│   ├── attempts.py           # POST /api/attempts/score - Update scores
│   └── users.py              # POST /api/users - Create users
│
├── services/
│   ├── Gemini_Services/      # AI content generation
│   │   ├── gemini_service.py       # Core generation logic
│   │   ├── key_manager.py          # API key rotation
│   │   └── teaching_prompt.py      # System prompts
│   │
│   ├── db_services/          # Database operations
│   │   ├── db.py                   # Session management
│   │   └── push_to_db.py           # Curriculum insertion
│   │
│   ├── unstructured_service.py    # Document parsing service
│   └── manual_parsing.py          # Content extraction logic
│
├── config.py                 # Environment configuration
├── main.py                   # FastAPI application entry point
├── .env                      # Environment variables (not committed)
└── requirements.txt          # Python dependencies
```

## 🗄️ Database Schema

### Tables

#### `users`
```sql
id UUID PRIMARY KEY
name TEXT
created_at TIMESTAMP
```

#### `curriculums`
```sql
id UUID PRIMARY KEY
user_id UUID → users(id)
title TEXT
description TEXT
created_at TIMESTAMP
```

#### `modules`
```sql
id UUID PRIMARY KEY
curriculum_id UUID → curriculums(id)
title TEXT
position INTEGER
created_at TIMESTAMP
```

#### `subtopics`
```sql
id UUID PRIMARY KEY
module_id UUID → modules(id)
title TEXT
content TEXT
score INTEGER DEFAULT 0
position INTEGER
created_at TIMESTAMP
```

#### `teaching_blocks`
```sql
id UUID PRIMARY KEY
subtopic_id UUID → subtopics(id)
blocks_json JSONB
created_at TIMESTAMP
```

## 🔧 Setup

### Prerequisites
- Python 3.12+
- PostgreSQL database (Neon DB recommended)
- API keys:
  - Google Gemini API key(s)
  - Unstructured API key

### Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
UNSTRUCTURED_API_KEY=your_key_here
GEMINI_API_KEY_1=key1
GEMINI_API_KEY_2=key2
GEMINI_API_KEY_3=key3
```

### Installation

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### Run Server

```bash
uvicorn main:app --reload
```

Server runs at `http://127.0.0.1:8000`

## 🔑 Key Implementation Details

### API Key Rotation (`key_manager.py`)
```python
class GeminiKeyManager:
    def __init__(self):
        self.keys = self._load_keys()  # Loads GEMINI_API_KEY_1, _2, _3...
        self.current_index = 0
    
    def execute_with_retry(self, func, *args, **kwargs):
        for _ in range(len(self.keys)):
            key = self.get_next_key()
            try:
                return func(key, *args, **kwargs)
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    continue
                raise e
        raise Exception("All API keys exhausted")
```

### Content Generation Flow
1. Check cache in `teaching_blocks`
2. If not cached:
   - Build adaptive prompt based on learner score
   - Try `gemini-3-flash-preview`
   - On failure, fallback to `gemini-2.5-flash`
   - Parse JSON response into Pydantic models
   - Clean simulation HTML (remove code fences)
   - Store in cache
3. Return structured blocks

### Score Update Flow
1. Frontend calculates individual question scores
2. Frontend calculates average when all questions complete
3. POST to `/api/attempts/score` with final score
4. Backend updates `subtopics.score` (0-100)

## 📡 API Endpoints

### Document Upload
```http
POST /parse
Headers: X-User-Id, X-User-Name
Body: multipart/form-data (files)
Response: { curriculum_id, modules_created }
```

### Get Curriculum
```http
GET /api/curriculum?user_id={uuid}&curriculum_id={uuid}
Response: { modules: [...], curriculum_id }
```

### Get Teaching Content
```http
GET /api/teaching/{subtopic_id}?user_id={uuid}
Response: { blocks: [...], cached: boolean }
```

### Update Score
```http
POST /api/attempts/score
Body: { user_id, subtopic_id, final_score }
Response: { success: true, final_score }
```

## 🐛 Debugging

### Enable Debug Logging
Already enabled in code. Check console for:
- `[DEBUG]` - General information
- `[WARNING]` - API key rotation
- `[ERROR]` - Failures with traceback

### Common Issues

**Issue**: Teaching content shows "Simulation unavailable"
- **Cause**: Cached old content or API quota exhausted
- **Fix**: `DELETE FROM teaching_blocks;` and retry

**Issue**: 429 errors even with multiple keys
- **Cause**: All keys exhausted for the model
- **Fix**: Wait for quota reset or use different model

**Issue**: Database connection fails
- **Cause**: DNS issues with Neon DB
- **Fix**: Check `DNS_FIX_INSTRUCTIONS.txt`

## 🔒 Security Notes

- CORS currently set to `allow_origins=["*"]` for development
- **Production**: Restrict to frontend domain only
- API keys stored in `.env` (gitignored)
- User IDs are UUIDs for security

## 📈 Performance

- **Caching**: Teaching blocks cached indefinitely
- **Connection Pooling**: SQLAlchemy session management
- **Async**: FastAPI async endpoints for I/O operations
- **JSONB**: Fast JSON querying in PostgreSQL

## 🧪 Testing

Database connection test:
```bash
python test_db.py
```

## 📚 Related Documentation

- Main README: `../README.md`
- Frontend README: `../frontend/README.md`
- Feature roadmap: `../FEATURE_ORDER.md`

---

Built with FastAPI and Google Gemini AI
