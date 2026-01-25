# Orbit - Technical Design & Architecture

## Overview
Orbit is an AI-powered adaptive learning platform that eliminates the need for repeated prompting. Users upload study materials, and the system creates a structured, guided learning path with confidence-based adaptation.

**Core Philosophy**: "Shut up and Learn" - The system decides what to teach next, adapts to the learner, and tracks understanding without manual intervention.

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon DB)
- **AI Services**: 
  - Gemini 2.0 Flash (teaching content generation)
  - Unstructured API (document parsing)
- **NLP**: SpaCy (en_core_web_md) for semantic similarity
- **ORM**: SQLAlchemy with raw SQL for performance
- **Utilities**: ftfy (text cleaning), pydantic (validation)

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Custom CSS variables
- **State Management**: React Query (TanStack Query) for caching & data fetching
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **UI Components**: Radix UI + custom components
- **Typography**: DM Sans (Google Fonts)

### Infrastructure
- **Hosting**: Vercel (Frontend) + Render/Railway (Backend)
- **Database**: Neon DB (serverless PostgreSQL)
- **File Storage**: In-memory during processing (no permanent file storage)

---

## System Architecture

### 1. File Upload & Parsing Pipeline

```
User Uploads Files → Backend /parse endpoint
    ↓
Unstructured API Processing (hi_res strategy)
    ↓
Element Extraction (titles, text, formulas, tables)
    ↓
Garbage Filtering (page numbers, separators, low-quality text)
    ↓
Semantic Grouping (cosine similarity < 0.50 = new module)
    ↓
Database Storage (users → modules → subtopics)
    ↓
Frontend Redirect to Curriculum Page
```

**Key Functions**:
- `unstructured_service.py`: Handles file parsing via Unstructured API
- `manual_parsing.py`: Creates modules using semantic similarity
- `garbage_removal.py`: Filters noise (alphabet ratio, length thresholds)
- `push_to_db.py`: Stores structured data in PostgreSQL

---

## Database Schema

### Current Structure

```sql
-- Users (anonymous sessions tracked by UUID)
users
  - id: UUID (primary key)
  - name: VARCHAR
  - created_at: TIMESTAMP

-- Modules (semantic groups of related subtopics)
modules
  - id: UUID (primary key)
  - user_id: UUID (foreign key → users.id)
  - title: VARCHAR
  - position: INTEGER (display order)
  - created_at: TIMESTAMP

-- Subtopics (individual learning units)
subtopics
  - id: UUID (primary key)
  - module_id: UUID (foreign key → modules.id)
  - title: VARCHAR
  - content: TEXT (raw parsed content)
  - score: INTEGER (0-100, learner performance)
  - position: INTEGER (display order within module)
  - created_at: TIMESTAMP
```

### Planned Extensions

```sql
-- Teaching Blocks (Gemini-generated content, cached per subtopic)
teaching_blocks
  - id: UUID (primary key)
  - subtopic_id: UUID (foreign key → subtopics.id)
  - blocks_json: JSONB (array of teaching block objects)
  - generated_at: TIMESTAMP
  - updated_at: TIMESTAMP

-- User Attempts (track question attempts for scoring)
user_attempts
  - id: UUID (primary key)
  - user_id: UUID (foreign key → users.id)
  - subtopic_id: UUID (foreign key → subtopics.id)
  - block_index: INTEGER (which question block)
  - attempts: INTEGER (1-4)
  - score: FLOAT (1.0, 0.75, 0.25, 0.0)
  - answered_at: TIMESTAMP

-- Camera Metrics (facial tracking data for attention scoring)
camera_metrics
  - id: UUID (primary key)
  - user_id: UUID (foreign key → users.id)
  - subtopic_id: UUID (foreign key → subtopics.id)
  - session_duration: INTEGER (seconds)
  - blink_rate: FLOAT
  - looking_away_percentage: FLOAT
  - engagement_score: FLOAT (0-100)
  - recorded_at: TIMESTAMP
```

---

## Data Flow Architecture

### 2. Curriculum Loading (Frontend)

**Structure**: Flat hierarchy - `modules → subtopics` (no virtual topic grouping)

**Flow**:
```
Frontend Requests: GET /api/curriculum?user_id={uuid}
    ↓
Backend: Fetch modules + subtopics for user
    ↓
Frontend: Cache response (React Query with staleTime)
    ↓
Render flat CurriculumTree (Module → Subtopics directly)
```

**Caching Strategy**:
- Use React Query with `staleTime: 5 minutes` for curriculum data
- Cache teaching blocks indefinitely until manual invalidation (or user explicitly regenerates)
- Cache user attempts and scores with `staleTime: 1 minute`
- **Prefetch next subtopic**: When user opens a subtopic, prefetch the next one in background

---

### 3. Teaching Content Generation (Gemini)

**Trigger**: User clicks on a subtopic

**Flow**:
```
User Clicks Subtopic → Frontend checks cache
    ↓
Cache Miss → GET /api/teaching/{subtopic_id}
    ↓
Backend checks teaching_blocks table
    ↓
If exists → Return cached blocks
    ↓
If not → Generate via Gemini API
    ↓
    Gemini Input:
      - Subtopic title
      - Subtopic content (raw parsed text)
      - Current learner score (0-100)
      - Instruction: Generate simulations as complete HTML with inline CSS/JS
    ↓
    Gemini Output: JSON array of teaching blocks (including HTML simulations)
    ↓
Store in teaching_blocks table
    ↓
Return to frontend + cache in React Query
    ↓
Render TeachingCanvas with blocks
    ↓
**Prefetch next subtopic** in background
```

**Prefetching Strategy**:
- When a subtopic loads, identify the next subtopic in sequence
- Trigger prefetch API call in background (React Query `prefetchQuery`)
- Cache the result so next navigation is instant

**Regenerate Feature**:
- User can click "Regenerate Content" button
- Deletes cached teaching_blocks for that subtopic
- Calls Gemini API to generate fresh content
- **20-second cooldown** enforced on frontend (disable button after use)
- Useful if user wants different explanations or updated simulations

---

## Teaching Block Types

Gemini generates an array of structured blocks. Each block has a `type` discriminator:

### Block Type Definitions

```typescript
type TeachingBlock = 
  | ParagraphBlock
  | FormulaBlock
  | InsightBlock
  | ListBlock
  | SimulationBlock
  | QuestionBlock

interface ParagraphBlock {
  type: "paragraph";
  content: string; // Plain explanatory text
}

interface FormulaBlock {
  type: "formula";
  formula: string; // LaTeX or plain text equation
  explanation: string; // What the formula means
}

interface InsightBlock {
  type: "insight";
  content: string; // Key takeaway or "pro tip"
}

interface ListBlock {
  type: "list";
  items: string[]; // Bulleted points
}

interface SimulationBlock {
  type: "simulation";
  html: string; // Complete HTML with inline CSS & JS (generated by Gemini)
  description: string; // What the simulation demonstrates
}

interface QuestionBlock {
  type: "question";
  questionType: "mcq" | "fill_in_blank";
  question: string;
  // For MCQ:
  options?: string[]; // Array of choices
  correctIndex?: number; // Index of correct answer
  // For Fill in Blank:
  correctAnswer?: string; // Expected answer
  // Common:
  explanations: {
    correct: string; // Why this is right
    incorrect: string[]; // Why each wrong option is wrong (MCQ only)
  };
}
```

---

## Scoring System

### Question-Based Scoring

**Points Per Question**:
- 1st attempt correct: **1.0 point**
- 2nd attempt correct: **0.75 points**
- 3rd attempt correct: **0.25 points**
- 4th+ attempt: **0.0 points**

**Subtopic Score Calculation**:
```
Subtopic Score = (Sum of question points / Total questions) × 100
→ Normalized to 0-100 scale
```

**Module Score Calculation**:
```
Module Score = Average of all subtopic scores
```

### Camera-Based Scoring (Attention Metrics)

**Client-side Processing** (using TensorFlow.js or similar):
- Blink rate (normal: 15-20 blinks/min)
- Looking away frequency
- Head pose detection
- Engagement duration

**Metrics Sent to Backend**:
```json
{
  "subtopic_id": "uuid",
  "session_duration": 180, // seconds
  "blink_rate": 18.5, // blinks per minute
  "looking_away_percentage": 12.3, // % of time
  "head_pose_stability": 0.85 // 0-1 scale
}
```

**Backend Processing**:
```python
def calculate_attention_score(metrics):
    # Normalize each metric to 0-100
    blink_score = normalize_blink_rate(metrics.blink_rate)
    focus_score = 100 - metrics.looking_away_percentage
    stability_score = metrics.head_pose_stability * 100
    
    # Weighted average
    attention_score = (
        blink_score * 0.2 +
        focus_score * 0.5 +
        stability_score * 0.3
    )
    return attention_score
```

### Subtopic Status & Scoring

**Important**: Score represents **confidence level/fragility**, NOT completion status.

**Status Meanings**:
- `available`: User can access this subtopic
- `in-progress`: User has started but not finished (optional tracking)
- `completed`: User has finished (can still have low score)
- `locked`: Not yet accessible (sequential module unlocking)

**Score Interpretation**:
| Score Range | Meaning                    | Color Marker |
|-------------|----------------------------|--------------|
| 0           | Not started yet            | Gray         |
| 1-40        | Weak understanding         | 🔴 Red       |
| 41-70       | Moderate understanding     | 🟡 Yellow    |
| 71-100      | Strong understanding       | 🟢 Green     |

**Navigation**:
- Users can jump between subtopics within a module
- Module unlocks sequentially (must complete 100% of previous module)
- **Skip option**: User can skip a subtopic (marks as completed but score stays 0)
- High scores indicate topic doesn't need repetition
- Low scores suggest topic should be reviewed

---

## Combined Score Calculation

**Final Subtopic Score**:
```
If camera enabled:
  Final Score = (Question Score × 0.7) + (Camera Score × 0.3)

If camera disabled:
  Final Score = Question Score × 1.0
```

---

## Color-Coded Topic Markers

Based on final subtopic scores:

| Score Range | Color      | Meaning              | Visual |
|-------------|------------|----------------------|--------|
| 0           | ⚪ Gray    | Not started          | Empty circle |
| 1-40        | 🔴 Red     | Needs improvement    | Red dot |
| 41-70       | 🟡 Yellow  | Progressing          | Yellow dot |
| 71-100      | 🟢 Green   | Mastered             | Green dot |

**UI Implementation**:
- Dot indicators next to topic/subtopic names
- Progress rings in curriculum tree
- Color-coded badges

---

## Simulation Block Implementation

**Format**: Self-contained HTML with inline CSS and JavaScript

**Example Structure**:
```html
<div style="width: 100%; height: 400px; background: #f5f5f5; border-radius: 8px; position: relative;">
  <style>
    .ball { position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #2563eb; }
    .slider { width: 80%; margin: 20px auto; }
  </style>
  
  <div id="simulation-container">
    <div class="ball" id="ball"></div>
    <input type="range" class="slider" id="force-slider" min="0" max="100" value="50">
  </div>
  
  <script>
    const ball = document.getElementById('ball');
    const slider = document.getElementById('force-slider');
    let velocity = 0;
    
    slider.addEventListener('input', (e) => {
      velocity = e.target.value / 10;
    });
    
    function animate() {
      // Physics simulation logic
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</div>
```

**Rendering**:
- Use `dangerouslySetInnerHTML` in React
- Sandbox with `<iframe>` if security concerns arise
- Provide reset button to restart simulation

---

## Caching Strategy

### Frontend (React Query)

```typescript
// Curriculum data (modules + subtopics)
useQuery({
  queryKey: ['curriculum', userId],
  queryFn: () => fetchCurriculum(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes in cache
});

// Teaching blocks (rarely change)
useQuery({
  queryKey: ['teaching', subtopicId],
  queryFn: () => fetchTeachingBlocks(subtopicId),
  staleTime: Infinity, // Never refetch automatically
  cacheTime: Infinity, // Keep in cache permanently
});

// User scores (frequently updated)
useQuery({
  queryKey: ['scores', userId, subtopicId],
  queryFn: () => fetchScores(userId, subtopicId),
  staleTime: 1 * 60 * 1000, // 1 minute
});
```

### Backend (Database Caching)

- Teaching blocks stored in `teaching_blocks` table (never regenerate unless manually invalidated)
- PostgreSQL connection pooling for performance
- Consider Redis for session-level caching if needed

---

## API Endpoints Design

### Existing
- `POST /parse` - Upload and parse files

### Planned

#### Curriculum Management
- `GET /api/curriculum?user_id={uuid}` - Get all modules + subtopics for user
  - Returns: `{ modules: [...], subtopics: [...] }`

#### Teaching Content
- `GET /api/teaching/{subtopic_id}?user_id={uuid}` - Get teaching blocks for subtopic
  - Checks DB cache first
  - Generates via Gemini if not found
  - Returns: `{ blocks: [...], subtopic: {...} }`

#### Scoring & Progress
- `POST /api/attempts` - Record question attempt
  - Body: `{ user_id, subtopic_id, block_index, attempts, correct }`
  - Calculates score and updates DB
  
- `POST /api/camera/metrics` - Submit camera tracking data
  - Body: `{ user_id, subtopic_id, session_duration, blink_rate, ... }`
  - Calculates attention score
  
- `GET /api/scores?user_id={uuid}` - Get all scores for user
  - Returns: `{ subtopic_scores: {...}, module_scores: {...} }`

#### Progress Tracking
- `PATCH /api/subtopics/{id}/status` - Update subtopic status
  - Body: `{ status: "in-progress" | "completed" }`

---

## Camera Integration (Client-Side)

### Technology Options
1. **TensorFlow.js + Face Landmarks Detection**
   - Library: `@tensorflow-models/face-landmarks-detection`
   - Detects: Eye positions, blink detection, head pose

2. **MediaPipe (via npm package)**
   - More accurate facial tracking
   - Better performance on lower-end devices

### Implementation Flow
```typescript
1. Request camera permission on LearnPage mount
2. Initialize face detection model
3. Process video frames every 100ms
4. Extract metrics:
   - Eye aspect ratio (blink detection)
   - Gaze direction (looking at screen vs away)
   - Head pose (Euler angles)
5. Aggregate data over session (e.g., every 30 seconds)
6. Send periodic updates to backend
7. Display privacy indicators (camera active icon)
```

**Privacy**:
- All processing happens client-side
- No video/images sent to server
- Only aggregated metrics sent
- User can disable camera tracking
- Clear visual indicator when camera is active

---

## Gemini Prompt Engineering

### Model Selection
- **Primary**: Gemini 2.0 Flash Experimental (high performance, low cost)
- **Note**: User has AI Studio Pro subscription for higher rate limits
- **Fallback**: If rate limits hit, queue requests or show error with retry

### System Prompt Requirements

**Key Requirements**:
1. Work from trusted content (no hallucination)
2. Adapt complexity based on learner score (0-100)
3. Return strict JSON format matching TypeScript block definitions
4. Generate **3-5 questions** per subtopic (Gemini decides based on content complexity)
5. Generate simulations **as complete HTML strings** with inline CSS and JavaScript
6. Simulations should be interactive and demonstrate key concepts visually

**Adaptation Rules**:
- **Score < 40** (Beginner): 
  - Simple language with real-world analogies
  - No advanced formulas
  - Max 2 blocks per concept
  - Focus on "What is it?"
  - More questions (4-5) with easier difficulty
  
- **Score 40-70** (Intermediate): 
  - Standard technical language
  - Include concept checks
  - Moderate formulas with explanations
  - Focus on "How does it work?"
  - Balanced questions (3-4) with medium difficulty
  
- **Score > 70** (Advanced): 
  - Concise and dense explanations
  - Focus on edge cases via misconception blocks
  - Complex formulas and derivations
  - Focus on "Why does it work this way?"
  - Fewer but harder questions (2-3) that test deep understanding

### Detailed Prompt Template

```
You are Orbit, an adaptive teaching engine that generates structured learning content.

ROLE:
- Transform verified lesson content into a sequence of structured teaching blocks
- Adapt explanations based on learner proficiency (score 0-100)
- Generate interactive simulations when visual learning aids understanding
- Create quiz questions that test comprehension at appropriate difficulty

INPUT PARAMETERS:
- Subtopic Title: "{title}"
- Lesson Content: "{parsed_content}"
- Learner Score: {score}/100

OUTPUT FORMAT (STRICT JSON):
Return a single JSON object with this structure:
{
  "blocks": [
    { "type": "paragraph" | "formula" | "insight" | "list" | "simulation" | "question", ... }
  ]
}

BLOCK TYPES AVAILABLE:

1. paragraph: Plain explanatory text
   { "type": "paragraph", "content": "string" }

2. formula: Mathematical equation with explanation
   { "type": "formula", "formula": "F = ma", "explanation": "string" }

3. insight: Key takeaway or pro tip
   { "type": "insight", "content": "string" }

4. list: Bulleted points
   { "type": "list", "items": ["point 1", "point 2", ...] }

5. simulation: COMPLETE HTML with inline CSS/JS (self-contained!)
   {
     "type": "simulation",
     "html": "<!DOCTYPE html><html>...<style>...</style>...<script>...</script></html>",
     "description": "What this simulation demonstrates"
   }

6. question: MCQ or fill-in-blank
   {
     "type": "question",
     "questionType": "mcq" | "fill_in_blank",
     "question": "string",
     "options": ["A", "B", "C"],  // for MCQ only
     "correctIndex": 0,             // for MCQ only
     "correctAnswer": "string",     // for fill_in_blank only
     "explanations": {
       "correct": "Why this is right",
       "incorrect": ["Why A is wrong", "Why C is wrong"]  // for MCQ only
     }
   }

SIMULATION REQUIREMENTS:
- Must be COMPLETE HTML (no external dependencies, no CDN links)
- All CSS in <style> tags
- All JavaScript in <script> tags
- Must be interactive (sliders, buttons, drag, etc.)
- Max ~200 lines of code total
- Must work when inserted via dangerouslySetInnerHTML in React
- Use vanilla JavaScript (no frameworks)
- Example topics: F=ma, circular motion, friction, waves, sorting algorithms, etc.

QUESTION REQUIREMENTS:
- Generate 2-5 questions per subtopic based on content complexity
- Difficulty matches learner score:
  - Score <40: Basic recall questions ("What is...?", "Define...")
  - Score 40-70: Application questions ("Calculate...", "If X then Y?")
  - Score >70: Analysis questions ("Why...", "What if...", edge cases)
- For MCQ: 3-4 options, explain each wrong answer
- For fill-in-blank: Accept case-insensitive answers (frontend handles this)
- Each question tracks attempts (1-4)

CONTENT SEQUENCING:
1. Start with a paragraph block to introduce the concept
2. Add formulas if relevant
3. Insert insights after explanations
4. Use lists for itemized information
5. Add simulation AFTER explanation (not before)
6. End with questions to test understanding

BEHAVIORAL RULES:
1. Maintain 100% factual integrity of source content
2. Never invent information not in the lesson content
3. Improve clarity through sequencing, not by adding fluff
4. No executable code outside simulation blocks
5. No conversational filler
6. Stick to JSON format exactly
```

### Example Gemini Output

```json
{
  "blocks": [
    {
      "type": "paragraph",
      "content": "Newton's Second Law states that the force acting on an object equals its mass times its acceleration. This fundamental relationship explains how objects move when forces are applied."
    },
    {
      "type": "formula",
      "formula": "F = m × a",
      "explanation": "Force (N) = mass (kg) × acceleration (m/s²)"
    },
    {
      "type": "insight",
      "content": "Think of mass as 'resistance to acceleration.' The more massive an object, the more force you need to accelerate it by the same amount."
    },
    {
      "type": "simulation",
      "html": "<div style='width:100%;padding:20px;background:#f5f5f5;border-radius:8px'><style>.box{width:40px;height:40px;background:#2563eb;position:absolute;}</style><div style='position:relative;height:200px;border:2px solid #ccc;'><div class='box' id='box'></div></div><label>Force: <input type='range' id='force' min='0' max='100' value='50'><span id='val'>50N</span></label><script>const box=document.getElementById('box');const force=document.getElementById('force');const val=document.getElementById('val');let pos=0;let vel=0;force.addEventListener('input',e=>{val.textContent=e.target.value+'N'});function animate(){const f=parseFloat(force.value);const acc=f/10;vel+=acc*0.016;pos+=vel*0.016;if(pos>300){pos=0;vel=0;}box.style.left=pos+'px';requestAnimationFrame(animate);}animate();</script></div>",
      "description": "Interactive demonstration of F=ma. Adjust the force slider to see how acceleration changes."
    },
    {
      "type": "question",
      "questionType": "mcq",
      "question": "A 2kg object is pushed with 10N of force. What is its acceleration?",
      "options": ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"],
      "correctIndex": 1,
      "explanations": {
        "correct": "Using F = ma, we get a = F/m = 10N / 2kg = 5 m/s²",
        "incorrect": [
          "This would be correct if F = m/a, but the formula is F = ma",
          "This assumes a = F, forgetting to divide by mass",
          "This assumes a = F × m, but we need to divide, not multiply"
        ]
      }
    },
    {
      "type": "question",
      "questionType": "fill_in_blank",
      "question": "If you double the force on an object while keeping mass constant, the acceleration will _____.",
      "correctAnswer": "double",
      "explanations": {
        "correct": "Since F = ma, force and acceleration are directly proportional. Doubling F doubles a.",
        "incorrect": []
      }
    }
  ]
}
```

---

## Performance Optimizations

1. **Database**:
   - Index on `user_id`, `module_id`, `subtopic_id`
   - JSONB indexing for teaching_blocks
   - Connection pooling (NullPool for serverless)

2. **API**:
   - Paginate curriculum if > 50 modules
   - Lazy load teaching blocks (on-demand)
   - Compress JSON responses (gzip)

3. **Frontend**:
   - Code splitting by route
   - Lazy load Framer Motion animations
   - Virtualize long lists (if needed)
   - Preload next subtopic in background

4. **Caching**:
   - React Query aggressive caching
   - Service Worker for offline curriculum access (future)
   - LocalStorage for user preferences

---

## Development Workflow

### Database Migration
1. Switch from SQLite to Neon DB
2. Create new tables (teaching_blocks, user_attempts, camera_metrics)
3. Add indexes
4. Test with sample data

### API Development
1. Create new routes in `backend/routes/`
2. Implement Gemini content generation
3. Add caching logic
4. Test endpoints with Postman

### Frontend Integration
1. Set up React Query
2. Replace mock data with API calls
3. Implement virtual topic grouping
4. Add loading states and error handling

### Camera Integration
1. Add TensorFlow.js dependencies
2. Create `useFaceTracking` hook
3. Implement metrics extraction
4. Add privacy controls

### Testing
1. Unit tests for scoring algorithms
2. Integration tests for API endpoints
3. E2E tests for learning flow
4. Performance testing for Gemini API

---

## Deployment Architecture

```
Frontend (Vercel)
    ↓ HTTPS
Backend (Render/Railway)
    ↓ Connection Pool
Neon DB (PostgreSQL)
    ↓ API Keys
External Services:
  - Unstructured API
  - Gemini API
```

**Environment Variables**:
- `DATABASE_URL` - Neon DB connection string
- `UNSTRUCTURED_API_KEY`
- `GEMINI_API_KEY`
- `VITE_API_BASE_URL` (frontend)
- `CORS_ORIGINS` (backend security)

---

## Future Enhancements

1. **Spaced Repetition**: Schedule subtopic reviews based on forgetting curve
2. **Peer Comparison**: Anonymous benchmarking against other learners
3. **Audio Explanations**: Text-to-speech for accessibility
4. **Mobile App**: React Native version
5. **Collaborative Learning**: Study groups, shared notes
6. **Advanced Analytics**: Learning patterns, time spent, difficulty prediction
7. **Custom Simulations**: User-requested visualizations
8. **Multi-language Support**: i18n for global reach

---

## Open Questions & Design Decisions

*To be filled during development*

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-21  
**Maintained By**: Development Team
