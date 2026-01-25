# Orbit - Step-by-Step Implementation Plan

## Current Status ✅

### What's Already Built:
- ✅ File upload system (frontend + backend)
- ✅ Unstructured API integration for parsing PDFs, PPTs, etc.
- ✅ Manual parsing with semantic similarity grouping
- ✅ Database schema (users, modules, subtopics) with SQLite
- ✅ Gemini service foundation (teaching block types defined)
- ✅ Landing page with animated logo
- ✅ File uploader component with drag-and-drop
- ✅ Mock curriculum tree UI
- ✅ Teaching canvas with content rendering
- ✅ User session management (UUID-based)
- ✅ Basic routing structure

### What's Mock/Incomplete:
- ❌ Curriculum API (using mock data)
- ❌ Teaching content generation (Gemini not called)
- ❌ Database caching for teaching blocks
- ❌ Question scoring system
- ❌ Camera tracking integration
- ❌ Performance scoring & color markers
- ❌ PostgreSQL/Neon DB migration
- ❌ React Query caching
- ❌ Virtual topic grouping

---

## Implementation Roadmap

> **Total Estimated Time**: 3-4 weeks (depends on testing & debugging)

---

## 📋 Phase 1: Database Migration & Schema Updates
**Duration**: 2-3 days

### Step 1.1: Migrate to Neon DB (PostgreSQL)
**Files to Modify**: `backend/config.py`, `backend/.env`

- [ ] Create Neon DB project
- [ ] Get PostgreSQL connection string
- [ ] Update `config.py` to use Neon DB URL
- [ ] Install PostgreSQL adapter: `pip install psycopg2-binary`
- [ ] Test basic connection

**Acceptance Criteria**:
- ✓ Backend connects to Neon DB successfully
- ✓ Existing tables are created in PostgreSQL

---

### Step 1.2: Create New Database Tables
**Files to Create**: `backend/migrations/` or manual SQL scripts

**New Tables**:
1. **teaching_blocks** - Cache Gemini-generated content
   ```sql
   CREATE TABLE teaching_blocks (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
       blocks_json JSONB NOT NULL,
       generated_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );
   CREATE INDEX idx_teaching_blocks_subtopic ON teaching_blocks(subtopic_id);
   ```

2. **user_attempts** - Track question attempts
   ```sql
   CREATE TABLE user_attempts (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
       block_index INTEGER NOT NULL,
       attempts INTEGER NOT NULL CHECK (attempts BETWEEN 1 AND 4),
       score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
       answered_at TIMESTAMP DEFAULT NOW()
   );
   CREATE INDEX idx_attempts_user_subtopic ON user_attempts(user_id, subtopic_id);
   ```

3. **camera_metrics** - Store attention tracking data
   ```sql
   CREATE TABLE camera_metrics (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
       session_duration INTEGER NOT NULL,
       blink_rate FLOAT,
       looking_away_percentage FLOAT,
       head_pose_stability FLOAT,
       engagement_score FLOAT,
       recorded_at TIMESTAMP DEFAULT NOW()
   );
   CREATE INDEX idx_camera_user_subtopic ON camera_metrics(user_id, subtopic_id);
   ```

**Action Items**:
- [ ] Create migration script or run SQL manually on Neon DB
- [ ] Add indexes for performance
- [ ] Verify tables exist with `\dt` in psql

**Acceptance Criteria**:
- ✓ All 3 new tables created
- ✓ Foreign keys and indexes in place
- ✓ Can insert/query test data

---

### Step 1.3: Update Existing Tables
**Files to Modify**: Migration scripts or manual SQL

**Changes Needed**:
1. Add `color_marker` to subtopics (optional, can be computed)
2. Ensure UUID types are consistent
3. Add any missing timestamps

**Optional Enhancements**:
```sql
ALTER TABLE subtopics ADD COLUMN color_marker VARCHAR(10) DEFAULT 'red';
-- Values: 'red', 'yellow', 'green'
```

---

## 📡 Phase 2: Backend API Development
**Duration**: 5-7 days

### Step 2.1: Create Curriculum API Endpoint
**Files to Create**: `backend/routes/curriculum.py`

**Endpoint**: `GET /api/curriculum?user_id={uuid}`

**Response Format**:
```json
{
  "modules": [
    {
      "id": "uuid",
      "title": "Module Title",
      "position": 1,
      "subtopics": [
        {
          "id": "uuid",
          "title": "Subtopic Title",
          "score": 75,
          "position": 1,
          "status": "completed"
        }
      ]
    }
  ]
}
```

**Implementation**:
```python
# backend/routes/curriculum.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from services.db_services.db import get_session
from services.curriculum_service import get_user_curriculum

router = APIRouter(prefix="/api", tags=["Curriculum"])

@router.get("/curriculum")
async def get_curriculum(
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    curriculum = get_user_curriculum(db, user_id)
    return curriculum
```

**Service Layer** (`backend/services/curriculum_service.py`):
```python
from sqlalchemy import text

def get_user_curriculum(db: Session, user_id: str):
    # Fetch modules
    modules_result = db.execute(
        text("SELECT * FROM modules WHERE user_id = CAST(:user_id AS uuid) ORDER BY position"),
        {"user_id": user_id}
    ).fetchall()
    
    modules = []
    for module_row in modules_result:
        # Fetch subtopics for this module
        subtopics_result = db.execute(
            text("SELECT * FROM subtopics WHERE module_id = CAST(:module_id AS uuid) ORDER BY position"),
            {"module_id": str(module_row.id)}
        ).fetchall()
        
        subtopics = [
            {
                "id": str(st.id),
                "title": st.title,
                "score": st.score,
                "position": st.position,
                "status": determine_status(st.score)  # Helper function
            }
            for st in subtopics_result
        ]
        
        modules.append({
            "id": str(module_row.id),
            "title": module_row.title,
            "position": module_row.position,
            "subtopics": subtopics
        })
    
    return {"modules": modules}

def determine_status(score: int) -> str:
    if score == 0:
        return "available"
    elif score < 100:
        return "in-progress"
    else:
        return "completed"
```

**Action Items**:
- [ ] Create `routes/curriculum.py`
- [ ] Create `services/curriculum_service.py`
- [ ] Register router in `main.py`
- [ ] Test with Postman/curl

**Acceptance Criteria**:
- ✓ Endpoint returns curriculum data
- ✓ Subtopics are grouped under modules
- ✓ Empty response if no data for user

---

### Step 2.2: Create Teaching Content API Endpoint
**Files to Create**: `backend/routes/teaching.py`

**Endpoint**: `GET /api/teaching/{subtopic_id}?user_id={uuid}`

**Flow**:
1. Check if teaching_blocks exist in DB for this subtopic
2. If yes → return cached blocks
3. If no → generate via Gemini → save to DB → return

**Implementation**:
```python
# backend/routes/teaching.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.db_services.db import get_session
from services.teaching_service import get_or_generate_teaching_blocks

router = APIRouter(prefix="/api", tags=["Teaching"])

@router.get("/teaching/{subtopic_id}")
async def get_teaching_content(
    subtopic_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    try:
        teaching_data = get_or_generate_teaching_blocks(db, subtopic_id, user_id)
        return teaching_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Service Layer** (`backend/services/teaching_service.py`):
```python
from sqlalchemy import text
from services.Gemini_Services.gemini_service import generate_teaching_blocks
import json

def get_or_generate_teaching_blocks(db: Session, subtopic_id: str, user_id: str):
    # Check cache
    cached = db.execute(
        text("SELECT blocks_json FROM teaching_blocks WHERE subtopic_id = CAST(:sid AS uuid)"),
        {"sid": subtopic_id}
    ).fetchone()
    
    if cached:
        return {
            "blocks": json.loads(cached.blocks_json),
            "cached": True
        }
    
    # Fetch subtopic content
    subtopic = db.execute(
        text("SELECT title, content, score FROM subtopics WHERE id = CAST(:sid AS uuid)"),
        {"sid": subtopic_id}
    ).fetchone()
    
    if not subtopic:
        raise ValueError("Subtopic not found")
    
    # Get user's current score for adaptation
    user_score = get_user_score(db, user_id, subtopic_id)
    
    # Generate via Gemini
    gemini_response = generate_teaching_blocks(
        lesson_title=subtopic.title,
        subtopic_title=subtopic.title,
        lesson_content=subtopic.content,
        learner_score=user_score
    )
    
    blocks_json = json.dumps([block.dict() for block in gemini_response.blocks])
    
    # Save to cache
    db.execute(
        text("""
            INSERT INTO teaching_blocks (subtopic_id, blocks_json)
            VALUES (CAST(:sid AS uuid), CAST(:blocks AS jsonb))
        """),
        {"sid": subtopic_id, "blocks": blocks_json}
    )
    db.commit()
    
    return {
        "blocks": json.loads(blocks_json),
        "cached": False
    }

def get_user_score(db: Session, user_id: str, subtopic_id: str) -> int:
    # Get average score from user_attempts
    result = db.execute(
        text("""
            SELECT AVG(score) * 100 as avg_score
            FROM user_attempts
            WHERE user_id = CAST(:uid AS uuid)
              AND subtopic_id = CAST(:sid AS uuid)
        """),
        {"uid": user_id, "sid": subtopic_id}
    ).fetchone()
    
    return int(result.avg_score) if result and result.avg_score else 0
```

**Action Items**:
- [ ] Create `routes/teaching.py`
- [ ] Create `services/teaching_service.py`
- [ ] Update `gemini_service.py` to match new block types
- [ ] Test Gemini generation with sample data
- [ ] Register router in `main.py`

**Acceptance Criteria**:
- ✓ First call generates blocks via Gemini
- ✓ Second call returns cached blocks
- ✓ Blocks match expected JSON format

---

### Step 2.3: Create Scoring APIs
**Files to Create**: `backend/routes/scoring.py`

**Endpoints**:

1. **POST /api/attempts** - Record question attempt
```python
@router.post("/attempts")
async def record_attempt(
    attempt: AttemptRequest,
    db: Session = Depends(get_session)
):
    score = calculate_score(attempt.attempts)  # 1.0, 0.75, 0.25, 0.0
    
    db.execute(
        text("""
            INSERT INTO user_attempts (user_id, subtopic_id, block_index, attempts, score)
            VALUES (CAST(:uid AS uuid), CAST(:sid AS uuid), :block, :att, :score)
        """),
        {
            "uid": attempt.user_id,
            "sid": attempt.subtopic_id,
            "block": attempt.block_index,
            "att": attempt.attempts,
            "score": score
        }
    )
    db.commit()
    
    # Update subtopic score
    update_subtopic_score(db, attempt.subtopic_id)
    
    return {"success": True, "score": score}
```

2. **POST /api/camera/metrics** - Submit camera data
```python
@router.post("/camera/metrics")
async def submit_camera_metrics(
    metrics: CameraMetrics,
    db: Session = Depends(get_session)
):
    engagement_score = calculate_engagement_score(metrics)
    
    db.execute(
        text("""
            INSERT INTO camera_metrics (
                user_id, subtopic_id, session_duration, blink_rate,
                looking_away_percentage, head_pose_stability, engagement_score
            ) VALUES (
                CAST(:uid AS uuid), CAST(:sid AS uuid), :duration, :blink,
                :looking_away, :pose, :engagement
            )
        """),
        {
            "uid": metrics.user_id,
            "sid": metrics.subtopic_id,
            "duration": metrics.session_duration,
            "blink": metrics.blink_rate,
            "looking_away": metrics.looking_away_percentage,
            "pose": metrics.head_pose_stability,
            "engagement": engagement_score
        }
    )
    db.commit()
    
    # Update subtopic score with combined score
    update_subtopic_score_with_camera(db, metrics.subtopic_id)
    
    return {"success": True, "engagement_score": engagement_score}
```

3. **GET /api/scores?user_id={uuid}** - Get all user scores
```python
@router.get("/scores")
async def get_scores(
    user_id: str = Query(...),
    db: Session = Depends(get_session)
):
    # Fetch subtopic scores
    # Calculate module aggregates
    # Return with color markers
    pass
```

**Helper Functions** (`backend/services/scoring_service.py`):
```python
def calculate_score(attempts: int) -> float:
    scores = {1: 1.0, 2: 0.75, 3: 0.25}
    return scores.get(attempts, 0.0)

def calculate_engagement_score(metrics: CameraMetrics) -> float:
    # Normalize blink rate (15-20 is ideal)
    blink_score = max(0, 100 - abs(metrics.blink_rate - 17.5) * 5)
    
    # Focus score
    focus_score = 100 - metrics.looking_away_percentage
    
    # Stability score
    stability_score = metrics.head_pose_stability * 100
    
    # Weighted average
    engagement = (
        blink_score * 0.2 +
        focus_score * 0.5 +
        stability_score * 0.3
    )
    return engagement

def update_subtopic_score(db: Session, subtopic_id: str):
    # Calculate average question score
    result = db.execute(
        text("""
            SELECT AVG(score) * 100 as question_score
            FROM user_attempts
            WHERE subtopic_id = CAST(:sid AS uuid)
        """),
        {"sid": subtopic_id}
    ).fetchone()
    
    question_score = result.question_score if result else 0
    
    # Get camera score
    camera_result = db.execute(
        text("""
            SELECT AVG(engagement_score) as camera_score
            FROM camera_metrics
            WHERE subtopic_id = CAST(:sid AS uuid)
        """),
        {"sid": subtopic_id}
    ).fetchone()
    
    camera_score = camera_result.camera_score if camera_result else question_score
    
    # Combined score (70% questions, 30% camera)
    final_score = int(question_score * 0.7 + camera_score * 0.3)
    
    # Update subtopic
    db.execute(
        text("UPDATE subtopics SET score = :score WHERE id = CAST(:sid AS uuid)"),
        {"score": final_score, "sid": subtopic_id}
    )
    db.commit()

def get_color_marker(score: int) -> str:
    if score <= 40:
        return "red"
    elif score <= 70:
        return "yellow"
    else:
        return "green"
```

**Action Items**:
- [ ] Create `routes/scoring.py`
- [ ] Create `services/scoring_service.py`
- [ ] Define Pydantic models for requests
- [ ] Test scoring calculations
- [ ] Register router in `main.py`

**Acceptance Criteria**:
- ✓ Attempts recorded correctly
- ✓ Scores calculated accurately
- ✓ Camera metrics stored
- ✓ Subtopic scores updated

---

## 🎨 Phase 3: Frontend Integration
**Duration**: 5-7 days

### Step 3.1: Set Up React Query
**Files to Modify**: `frontend/src/main.tsx`, create `frontend/src/lib/api.ts`

**Install Dependencies**:
```bash
npm install @tanstack/react-query@latest
```

**Setup QueryClient**:
```typescript
// frontend/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap App with QueryClientProvider
```

**API Client** (`frontend/src/lib/api.ts`):
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
  getCurriculum: async (userId: string) => {
    const res = await fetch(`${API_BASE}/api/curriculum?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch curriculum');
    return res.json();
  },
  
  getTeachingContent: async (subtopicId: string, userId: string) => {
    const res = await fetch(`${API_BASE}/api/teaching/${subtopicId}?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch teaching content');
    return res.json();
  },
  
  recordAttempt: async (data: AttemptData) => {
    const res = await fetch(`${API_BASE}/api/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record attempt');
    return res.json();
  },
  
  // ... more endpoints
};
```

**Action Items**:
- [ ] Install React Query
- [ ] Set up QueryClient
- [ ] Create API client utilities
- [ ] Add environment variables

**Acceptance Criteria**:
- ✓ React Query DevTools visible in dev mode
- ✓ API client can make requests

---

### Step 3.2: Replace Mock Curriculum with Real Data
**Files to Modify**: 
- `frontend/src/pages/CurriculumPage.tsx`
- Create `frontend/src/hooks/useCurriculum.ts`

**Custom Hook**:
```typescript
// frontend/src/hooks/useCurriculum.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

export function useCurriculum() {
  const { uid } = createOrGetUser();
  
  return useQuery({
    queryKey: ['curriculum', uid],
    queryFn: () => api.getCurriculum(uid),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Virtual Topic Grouping**:
```typescript
// frontend/src/utils/groupSubtopics.ts
export function groupSubtopicsIntoTopics(subtopics: Subtopic[]) {
  // Logic to group subtopics into virtual topics
  // Option 1: Group by sequential numbering (sub-1-1-1, sub-1-1-2 → same topic)
  // Option 2: Use semantic similarity on titles
  // Option 3: Every N subtopics = 1 topic
  
  const topics: Topic[] = [];
  // Implementation here...
  return topics;
}
```

**Update CurriculumPage**:
```typescript
export default function CurriculumPage() {
  const { data, isLoading, error } = useCurriculum();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  // Transform data
  const curriculum = {
    ...data,
    modules: data.modules.map(mod => ({
      ...mod,
      topics: groupSubtopicsIntoTopics(mod.subtopics)
    }))
  };
  
  return <CurriculumTree course={curriculum} ... />;
}
```

**Action Items**:
- [ ] Create `useCurriculum` hook
- [ ] Implement virtual topic grouping
- [ ] Update CurriculumPage to use real data
- [ ] Add loading and error states
- [ ] Remove mock import

**Acceptance Criteria**:
- ✓ Curriculum fetches from API
- ✓ Modules and subtopics display correctly
- ✓ Virtual topics group logically
- ✓ Loading/error states work

---

### Step 3.3: Integrate Teaching Content API
**Files to Modify**:
- `frontend/src/components/teaching/TeachingCanvas.tsx`
- Create `frontend/src/hooks/useTeachingContent.ts`

**Custom Hook**:
```typescript
export function useTeachingContent(subtopicId: string) {
  const { uid } = createOrGetUser();
  
  return useQuery({
    queryKey: ['teaching', subtopicId],
    queryFn: () => api.getTeachingContent(subtopicId, uid),
    staleTime: Infinity, // Never refetch
    enabled: !!subtopicId,
  });
}
```

**Update TeachingCanvas**:
```typescript
export function TeachingCanvas({ subtopicId, onNext }: Props) {
  const { data, isLoading } = useTeachingContent(subtopicId);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  
  if (isLoading) return <TeachingSkeleton />;
  if (!data) return <ErrorState />;
  
  const blocks = data.blocks;
  const visibleBlocks = blocks.slice(0, currentChunkIndex + 1);
  
  return (
    // Render blocks...
  );
}
```

**Action Items**:
- [ ] Create `useTeachingContent` hook
- [ ] Update TeachingCanvas to fetch real data
- [ ] Render all block types correctly
- [ ] Handle simulation blocks (dangerouslySetInnerHTML)
- [ ] Add loading skeleton

**Acceptance Criteria**:
- ✓ Teaching content loads from API
- ✓ All block types render
- ✓ Simulations execute properly
- ✓ Content is cached after first load

---

### Step 3.4: Implement Question Scoring UI
**Files to Modify**:
- `frontend/src/components/practice/PracticeQuestion.tsx`
- Create `frontend/src/hooks/useScoring.ts`

**Scoring Hook**:
```typescript
export function useScoring() {
  const queryClient = useQueryClient();
  
 const recordAttempt = useMutation({
    mutationFn: api.recordAttempt,
    onSuccess: () => {
      // Invalidate scores to refetch
      queryClient.invalidateQueries(['scores']);
      queryClient.invalidateQueries(['curriculum']);
    },
  });
  
  return { recordAttempt };
}
```

**Question Component**:
```typescript
export function QuestionBlock({ question, blockIndex, subtopicId }: Props) {
  const [attempts, setAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const { uid } = createOrGetUser();
  const { recordAttempt } = useScoring();
  
  const handleSubmit = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    const isCorrect = selectedAnswer === question.correctIndex;
    
    if (isCorrect || newAttempts >= 4) {
      // Record attempt
      recordAttempt.mutate({
        user_id: uid,
        subtopic_id: subtopicId,
        block_index: blockIndex,
        attempts: newAttempts,
        correct: isCorrect,
      });
    }
  };
  
  return (
    // Render question UI with attempt counter
  );
}
```

**Action Items**:
- [ ] Create `useScoring` hook
- [ ] Update PracticeQuestion with attempt tracking
- [ ] Show explanations after correct answer
- [ ] Display score feedback (1.0, 0.75, 0.25, 0.0)
- [ ] Disable after 4 attempts

**Acceptance Criteria**:
- ✓ Questions track attempts
- ✓ Scores recorded in backend
- ✓ Explanations shown after answer
- ✓ UI updates on success

---

## 📹 Phase 4: Camera Integration
**Duration**: 3-4 days

### Step 4.1: Install TensorFlow.js
**Dependencies**:
```bash
npm install @tensorflow/tfjs @tensorflow-models/face-landmarks-detection
```

**Action Items**:
- [ ] Install dependencies
- [ ] Add TypeScript types if needed

---

### Step 4.2: Create Face Tracking Hook
**Files to Create**: `frontend/src/hooks/useFaceTracking.ts`

**Implementation**:
```typescript
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { useEffect, useState, useRef } from 'react';

export function useFaceTracking(enabled: boolean) {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState({
    blinkRate: 0,
    lookingAwayPercentage: 0,
    headPoseStability: 1,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<any>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Load model
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
      };
      detectorRef.current = await faceLandmarksDetection.createDetector(
        model, 
        detectorConfig
      );
      
      setIsActive(true);
      startDetection();
    }
    
    function startDetection() {
      // Detect faces every 100ms
      // Extract metrics
      // Update state
    }
    
    setupCamera();
    
    return () => {
      // Cleanup video stream
    };
  }, [enabled]);
  
  return { isActive, metrics, videoRef };
}
```

**Metric Extraction**:
```typescript
function calculateMetrics(faces: any[]) {
  // Eye aspect ratio for blink detection
  // Gaze direction for looking away
  // Head rotation angles for stability
}
```

**Action Items**:
- [ ] Create `useFaceTracking` hook
- [ ] Implement camera permission request
- [ ] Add metric extraction logic
- [ ] Test on different devices

**Acceptance Criteria**:
- ✓ Camera activates with permission
- ✓ Face detected and tracked
- ✓ Metrics calculated accurately
- ✓ Works on laptop and mobile

---

### Step 4.3: Integrate Camera in LearnPage
**Files to Modify**: `frontend/src/pages/LearnPage.tsx`

**Implementation**:
```typescript
export default function LearnPage() {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const { isActive, metrics, videoRef } = useFaceTracking(cameraEnabled);
  const { subtopicId } = useParams();
  
  // Send metrics every 30 seconds
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      api.submitCameraMetrics({
        user_id: uid,
        subtopic_id: subtopicId,
        session_duration: 30,
        ...metrics,
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isActive, metrics]);
  
  return (
    <div>
      {/* Hidden video element for processing */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay />
      
      {/* Camera toggle button */}
      <button onClick={() => setCameraEnabled(!cameraEnabled)}>
        {cameraEnabled ? '📹 Camera Active' : '📷 Enable Camera'}
      </button>
      
      {/* Rest of UI */}
    </div>
  );
}
```

**Action Items**:
- [ ] Add camera toggle UI
- [ ] Display privacy indicator
- [ ] Send periodic metric updates
- [ ] Handle camera errors gracefully

**Acceptance Criteria**:
- ✓ Camera can be toggled on/off
- ✓ Privacy indicator visible when active
- ✓ Metrics sent to backend
- ✓ No performance lag

---

## 🎨 Phase 5: UI Polish & Color Markers
**Duration**: 2-3 days

### Step 5.1: Add Color Markers to Topics
**Files to Modify**: 
- `frontend/src/components/curriculum/CurriculumTree.tsx`
- `frontend/src/components/layout/TopicNavigator.tsx`

**Color Marker Component**:
```typescript
function ColorMarker({ score }: { score: number }) {
  const color = score <= 40 ? 'red' : score <= 70 ? 'yellow' : 'green';
  
  return (
    <span className={cn(
      "w-3 h-3 rounded-full",
      color === 'red' && "bg-red-500",
      color === 'yellow' && "bg-yellow-500",
      color === 'green' && "bg-green-500"
    )} />
  );
}
```

**Update Curriculum Display**:
```typescript
{subtopics.map(sub => (
  <div key={sub.id} className="flex items-center gap-2">
    <ColorMarker score={sub.score} />
    <span>{sub.title}</span>
    <span className="text-muted-foreground">
      {sub.score > 0 ? `${sub.score}%` : ''}
    </span>
  </div>
))}
```

**Action Items**:
- [ ] Create ColorMarker component
- [ ] Add to CurriculumTree
- [ ] Add to TopicNavigator
- [ ] Add tooltip explaining colors
- [ ] Animate color changes

**Acceptance Criteria**:
- ✓ Markers display correct colors
- ✓ Colors update when scores change
- ✓ Tooltips explain meaning

---

### Step 5.2: Add Progress Animations
**Files to Modify**: Various components

**Enhancements**:
- Progress bars animate on score updates
- Confetti on topic completion
- Smooth transitions between topics
- Score change animations

**Action Items**:
- [ ] Add framer-motion variants
- [ ] Create completion celebration
- [ ] Polish loading states
- [ ] Add micro-interactions

---

## 🧪 Phase 6: Testing & Optimization
**Duration**: 3-4 days

### Step 6.1: Backend Testing
- [ ] Unit tests for scoring calculations
- [ ] Integration tests for API endpoints
- [ ] Test Gemini API with various content types
- [ ] Load testing with multiple users
- [ ] Database query optimization

### Step 6.2: Frontend Testing
- [ ] Test curriculum loading with different data sizes
- [ ] Test camera on multiple devices
- [ ] Test question scoring flow
- [ ] Test caching behavior
- [ ] Mobile responsiveness

### Step 6.3: Performance Optimization
- [ ] Measure API response times
- [ ] Optimize database queries (add indexes)
- [ ] Reduce bundle size (code splitting)
- [ ] Optimize images and animations
- [ ] Test on slow network

---

## 🚀 Phase 7: Deployment
**Duration**: 1-2 days

### Step 7.1: Backend Deployment
- [ ] Set up environment variables on Render/Railway
- [ ] Connect to Neon DB
- [ ] Deploy backend
- [ ] Test production endpoints
- [ ] Set up monitoring (optional: Sentry)

### Step 7.2: Frontend Deployment
- [ ] Update API_BASE_URL for production
- [ ] Build optimized bundle
- [ ] Deploy to Vercel
- [ ] Test production app
- [ ] Set up analytics (optional: Vercel Analytics)

---

## 📊 Success Metrics

After implementation, verify:
- ✓ Users can upload files and see curriculum
- ✓ Teaching content generates via Gemini
- ✓ Questions track attempts and calculate scores
- ✓ Camera tracks attention (when enabled)
- ✓ Scores update and display color markers
- ✓ All data persists in Neon DB
- ✓ Caching reduces load times
- ✓ UI is responsive and polished

---

## 🔄 Ongoing Maintenance

Post-launch:
- Monitor Gemini API usage (costs)
- Track database size growth
- Gather user feedback
- Fix bugs as reported
- Add new features (see README_TDT.md for future enhancements)

---

**Total Estimated Timeline**: 3-4 weeks for full implementation

---

**Next Immediate Steps** (Start Here):
1. ✅ Create Neon DB account and get connection string
2. ✅ Update `backend/config.py` and `.env`
3. ✅ Run database migration (create new tables)
4. ✅ Test basic connection to Neon DB
5. ✅ Create `/api/curriculum` endpoint
