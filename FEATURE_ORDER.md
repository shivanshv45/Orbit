# Orbit - Feature Implementation Order

**Based on clarifications from 2026-01-23**

This document provides a step-by-step feature implementation order from current state to completion. Follow this sequence to build Orbit systematically.

---

## ✅ Prerequisites (Before Starting)

- [ ] Create Neon DB account and get PostgreSQL connection string
- [ ] Ensure Gemini API key is active (AI Studio Pro)
- [ ] Verify Unstructured API key is working
- [ ] Backup current code to git

---

## 🎯 Implementation Phases

### **Phase 1: Database Foundation** (2-3 days)
**Goal**: Migrate to Neon DB and create all required tables

#### Feature 1.1: Neon DB Migration
**Files**: `backend/config.py`, `backend/.env`

**Tasks**:
1. Update `DATABASE_URL` in `.env` with Neon DB connection string
2. Install `psycopg2-binary` for PostgreSQL support
3. Test basic connection with a simple query
4. Migrate existing schema (users, modules, subtopics) to Neon DB
5. Verify data persists correctly

**Acceptance Criteria**:
- ✓ Backend connects to Neon DB
- ✓ Existing `/parse` endpoint works with Neon DB
- ✓ Data survives server restarts

---

#### Feature 1.2: Create New Database Tables
**Files**: SQL scripts or manual execution

**Tasks**:
1. Create `teaching_blocks` table
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

2. Create `user_attempts` table
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

3. Create `camera_metrics` table
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

4. Add indexes for performance
5. Test insert/query operations

**Acceptance Criteria**:
- ✓ All 3 tables created successfully
- ✓ Foreign keys work correctly
- ✓ Indexes improve query speed
- ✓ Can insert and retrieve test data

---

### **Phase 2: Backend API - Curriculum** (1-2 days)
**Goal**: Replace mock curriculum with real database queries

#### Feature 2.1: Curriculum API Endpoint
**Files**: 
- `backend/routes/curriculum.py` (new)
- `backend/services/curriculum_service.py` (new)
- `backend/main.py` (update)

**Tasks**:
1. Create `/api/curriculum` GET endpoint
2. Implement `get_user_curriculum(db, user_id)` service function
3. Fetch modules and subtopics from database
4. Return flat structure: `{ modules: [...with subtopics nested...] }`
5. Register router in `main.py`
6. Test with Postman/curl

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
          "score": 0,
          "position": 1
        }
      ]
    }
  ]
}
```

**Acceptance Criteria**:
- ✓ Endpoint returns curriculum for given user_id
- ✓ Subtopics are nested under modules
- ✓ Returns empty array if no data
- ✓ Handles invalid user_id gracefully

---

### **Phase 3: Frontend - Curriculum Integration** (2 days)
**Goal**: Replace mock data with real API calls and implement caching

#### Feature 3.1: React Query Setup
**Files**:
- `frontend/src/main.tsx`
- `frontend/src/lib/api.ts` (new)
- `frontend/package.json`

**Tasks**:
1. Install React Query: `npm install @tanstack/react-query`
2. Set up QueryClient in `main.tsx`
3. Create API client utilities in `lib/api.ts`
4. Add `VITE_API_BASE_URL` to `.env`
5. Test basic query

**Acceptance Criteria**:
- ✓ React Query DevTools visible in dev mode
- ✓ QueryClient configured with proper defaults
- ✓ API client can make requests

---

#### Feature 3.2: Replace Mock Curriculum
**Files**:
- `frontend/src/hooks/useCurriculum.ts` (new)
- `frontend/src/pages/CurriculumPage.tsx`
- `frontend/src/components/curriculum/CurriculumTree.tsx`

**Tasks**:
1. Create `useCurriculum()` hook using React Query
2. Update `CurriculumPage` to use real data
3. Remove `mockCurriculum` import (but keep file for now)
4. Update `CurriculumTree` to handle flat `modules → subtopics` structure
5. Add loading spinner and error states
6. Display subtopics directly under modules (no virtual topic grouping)

**Acceptance Criteria**:
- ✓ Curriculum loads from API
- ✓ Modules display with nested subtopics
- ✓ Loading and error states work
- ✓ Data cached for 5 minutes
- ✓ No mock data used

---

### **Phase 4: Backend API - Teaching Content** (3-4 days)
**Goal**: Implement Gemini-powered teaching block generation with caching

#### Feature 4.1: Update Gemini Service
**Files**:
- `backend/services/Gemini_Services/gemini_service.py`
- `backend/services/Gemini_Services/teaching_prompt.py`

**Tasks**:
1. Update `teachingPrompt` with new detailed prompt from README_TDT.md
2. Update block type definitions to match TypeScript interfaces exactly
3. Add simulation HTML generation support
4. Add question block types (MCQ and fill-in-blank)
5. Test Gemini API with sample content
6. Handle JSON parsing errors gracefully

**Acceptance Criteria**:
- ✓ Gemini returns valid JSON matching block types
- ✓ Simulations are complete HTML strings
- ✓ Questions have correct structure
- ✓ Adapts based on learner score (test with 0, 50, 90)

---

#### Feature 4.2: Teaching Content API Endpoint
**Files**:
- `backend/routes/teaching.py` (new)
- `backend/services/teaching_service.py` (new)
- `backend/main.py` (update)

**Tasks**:
1. Create `/api/teaching/{subtopic_id}` GET endpoint
2. Implement cache check in `teaching_blocks` table
3. If cache miss, generate via Gemini
4. Save generated blocks to database (JSONB)
5. Return blocks with cache status
6. Register router in `main.py`
7. Test endpoint with various subtopics

**Response Format**:
```json
{
  "blocks": [
    { "type": "paragraph", "content": "..." },
    { "type": "simulation", "html": "...", "description": "..." },
    { "type": "question", ... }
  ],
  "cached": true
}
```

**Acceptance Criteria**:
- ✓ First call generates blocks via Gemini
- ✓ Second call returns cached blocks instantly
- ✓ Blocks stored as JSONB in database
- ✓ Error handling for Gemini failures (show error + retry)

---

#### Feature 4.3: Regenerate Content Endpoint
**Files**:
- `backend/routes/teaching.py`

**Tasks**:
1. Create `DELETE /api/teaching/{subtopic_id}/cache` endpoint
2. Delete cached blocks from database
3. Return success status
4. Frontend will call this then refetch

**Acceptance Criteria**:
- ✓ Cache deleted successfully
- ✓ Next fetch regenerates content
- ✓ Only deletes for specific subtopic

---

### **Phase 5: Frontend - Teaching Content** (3 days)
**Goal**: Display Gemini-generated content with prefetching

#### Feature 5.1: Teaching Content Hook
**Files**:
- `frontend/src/hooks/useTeachingContent.ts` (new)
- `frontend/src/components/teaching/TeachingCanvas.tsx`

**Tasks**:
1. Create `useTeachingContent(subtopicId)` hook
2. Update `TeachingCanvas` to fetch real data
3. Render all block types correctly:
   - Paragraph
   - Formula
   - Insight
   - List
   - **Simulation** (use `dangerouslySetInnerHTML`)
   - **Question** (new component)
4. Add loading skeleton
5. Handle errors with retry button

**Acceptance Criteria**:
- ✓ Teaching content loads from API
- ✓ All block types render correctly
- ✓ Simulations execute properly (HTML/CSS/JS)
- ✓ Content cached indefinitely
- ✓ No chunk-by-chunk reveal for now (show all blocks)

---

#### Feature 5.2: Question Block Component
**Files**:
- `frontend/src/components/teaching/QuestionBlock.tsx` (new)

**Tasks**:
1. Create component to render QuestionBlock
2. Support MCQ (multiple choice with options)
3. Support fill-in-blank (text input)
4. Track attempts (1-4)
5. Show explanations after correct answer or 4 attempts
6. Disable after completion
7. Visual feedback for correct/incorrect

**Acceptance Criteria**:
- ✓ MCQ renders with radio buttons
- ✓ Fill-in-blank renders with text input
- ✓ Attempts tracked locally
- ✓ Explanations shown appropriately
- ✓ No backend call yet (just UI)

---

#### Feature 5.3: Prefetching Next Subtopic
**Files**:
- `frontend/src/hooks/useTeachingContent.ts`
- `frontend/src/components/teaching/TeachingCanvas.tsx`

**Tasks**:
1. When a subtopic loads, identify next subtopic in sequence
2. Use React Query's `prefetchQuery` to load next subtopic in background
3. Next navigation feels instant

**Acceptance Criteria**:
- ✓ Next subtopic prefetched automatically
- ✓ Navigation to next subtopic is instant (cached)
- ✓ Prefetch only if next subtopic exists

---

#### Feature 5.4: Regenerate Content Button
**Files**:
- `frontend/src/components/teaching/TeachingCanvas.tsx`
- `frontend/src/hooks/useTeachingContent.ts`

**Tasks**:
1. Add "Regenerate Content" button (icon button in corner)
2. On click: DELETE cache, then refetch
3. Implement 20-second cooldown (disable button)
4. Show loading state during regeneration

**Acceptance Criteria**:
- ✓ Button visible and clickable
- ✓ Regeneration works (new content appears)
- ✓ 20-second cooldown enforced
- ✓ Loading state during regeneration

---

### **Phase 6: Backend API - Scoring System** (2-3 days)
**Goal**: Record question attempts and calculate scores

#### Feature 6.1: Scoring Service
**Files**:
- `backend/services/scoring_service.py` (new)

**Tasks**:
1. Implement `calculate_question_score(attempts)` function
   - 1st attempt: 1.0
   - 2nd attempt: 0.75
   - 3rd attempt: 0.25
   - 4th+ attempt: 0.0
2. Implement `update_subtopic_score(db, subtopic_id)` function
   - Calculate average of all question scores
   - Update subtopics.score field
3. Implement `get_color_marker(score)` helper
   - 0: "gray"
   - 1-40: "red"
   - 41-70: "yellow"
   - 71-100: "green"

**Acceptance Criteria**:
- ✓ Scoring logic matches spec
- ✓ Subtopic score updates correctly
- ✓ Color markers accurate

---

#### Feature 6.2: Attempts API Endpoint
**Files**:
- `backend/routes/scoring.py` (new)
- `backend/main.py` (update)

**Tasks**:
1. Create `POST /api/attempts` endpoint
2. Accept: `{ user_id, subtopic_id, block_index, attempts, correct }`
3. Calculate score based on attempts
4. Store in `user_attempts` table
5. Update subtopic score
6. Return success + calculated score

**Acceptance Criteria**:
- ✓ Attempts recorded correctly
- ✓ Scores calculated accurately
- ✓ Subtopic score updates
- ✓ Multiple questions for same subtopic work

---

### **Phase 7: Frontend - Question Scoring** (1-2 days)
**Goal**: Track attempts and submit scores

#### Feature 7.1: Question Scoring Integration
**Files**:
- `frontend/src/hooks/useScoring.ts` (new)
- `frontend/src/components/teaching/QuestionBlock.tsx`

**Tasks**:
1. Create `useScoring()` hook with `recordAttempt` mutation
2. Update `QuestionBlock` to call API after question completed
3. Show score feedback to user (1.0, 0.75, 0.25, 0.0)
4. Invalidate curriculum and scores queries after submission
5. Handle errors gracefully

**Acceptance Criteria**:
- ✓ Attempts submitted to backend
- ✓ Scores update in database
- ✓ Curriculum re-fetches to show updated scores
- ✓ User sees score feedback

---

### **Phase 8: Color Markers & UI Polish** (2 days)
**Goal**: Show confidence levels visually

#### Feature 8.1: Color Markers in Curriculum
**Files**:
- `frontend/src/components/curriculum/ColorMarker.tsx` (new)
- `frontend/src/components/curriculum/CurriculumTree.tsx`

**Tasks**:
1. Create `ColorMarker` component
2. Display dot next to each subtopic based on score
3. Add tooltip explaining what colors mean
4. Show percentage score next to marker

**Acceptance Criteria**:
- ✓ Gray for score 0
- ✓ Red for 1-40
- ✓ Yellow for 41-70
- ✓ Green for 71-100
- ✓ Tooltips work

---

#### Feature 8.2: Skip Subtopic Feature
**Files**:
- `frontend/src/pages/LearnPage.tsx`
- `backend/routes/scoring.py` (add endpoint)

**Tasks**:
1. Add "Skip" button in teaching interface
2. Create `PATCH /api/subtopics/{id}/skip` endpoint
3. Marks subtopic as completed but keeps score 0
4. Update curriculum to show as done
5. Allow user to still access skipped subtopics

**Acceptance Criteria**:
- ✓ Skip button visible
- ✓ Skipping works
- ✓ Score stays 0
- ✓ Subtopic marked as completed

---

### **Phase 9: Camera Integration** (3-4 days)
**Goal**: Track attention via webcam (optional)

#### Feature 9.1: Face Tracking Hook
**Files**:
- `frontend/src/hooks/useFaceTracking.ts` (new)
- `frontend/package.json`

**Tasks**:
1. Install TensorFlow.js: `npm install @tensorflow/tfjs @tensorflow-models/face-landmarks-detection`
2. Create `useFaceTracking(enabled)` hook
3. Request camera permission
4. Load face detection model
5. Extract metrics:
   - Blink rate
   - Looking away percentage
   - Head pose stability
6. Return aggregated metrics every 30 seconds

**Acceptance Criteria**:
- ✓ Camera activates with permission
- ✓ Face detected and tracked
- ✓ Metrics calculated
- ✓ Works on laptop webcam
- ✓ Privacy: no video sent to server

---

#### Feature 9.2: Camera UI Integration
**Files**:
- `frontend/src/pages/LearnPage.tsx`

**Tasks**:
1. Add camera toggle button (enable/disable)
2. Show hidden video element for processing
3. Display privacy indicator when active (camera icon)
4. Send metrics to backend every 30 seconds
5. Handle camera errors gracefully

**Acceptance Criteria**:
- ✓ Camera can be toggled on/off
- ✓ Privacy indicator visible
- ✓ Metrics sent periodically
- ✓ No performance lag

---

#### Feature 9.3: Camera Metrics API
**Files**:
- `backend/routes/scoring.py`
- `backend/services/scoring_service.py`

**Tasks**:
1. Create `POST /api/camera/metrics` endpoint
2. Accept camera metrics from frontend
3. Calculate engagement score (0-100)
4. Store in `camera_metrics` table
5. Update subtopic score with combined score:
   - If camera enabled: (Question × 0.7) + (Camera × 0.3)
   - If camera disabled: Question × 1.0

**Acceptance Criteria**:
- ✓ Metrics stored correctly
- ✓ Engagement score calculated
- ✓ Subtopic score updates with combined score
- ✓ Works with camera disabled too

---

### **Phase 10: Module Completion & Navigation** (1-2 days)
**Goal**: Sequential module unlocking and 100% completion

#### Feature 10.1: Module Locking Logic
**Files**:
- `backend/routes/curriculum.py`
- `frontend/src/components/curriculum/CurriculumTree.tsx`

**Tasks**:
1. Calculate module completion percentage (subtopics completed / total)
2. Lock next module until previous is 100% complete
3. Show lock icon on locked modules
4. Allow jumping between subtopics within unlocked modules

**Acceptance Criteria**:
- ✓ First module unlocked by default
- ✓ Next module unlocks at 100% completion
- ✓ Visual indicator for locked modules
- ✓ Within module, can jump to any subtopic

---

### **Phase 11: Testing & Bug Fixes** (2-3 days)
**Goal**: Ensure everything works together

#### Testing Checklist:
- [ ] Upload files → Parse → Database storage
- [ ] Curriculum loads correctly
- [ ] Teaching content generates via Gemini
- [ ] Simulations render and execute
- [ ] Questions track attempts
- [ ] Scores calculate correctly
- [ ] Color markers update
- [ ] Camera tracking works (optional)
- [ ] Prefetching speeds up navigation
- [ ] Regenerate content works
- [ ] Skip feature works
- [ ] Module unlocking works
- [ ] Error handling graceful
- [ ] Mobile responsive

**Tasks**:
1. Manual testing of full user flow
2. Test with different file types
3. Test with large curricula
4. Test camera on different devices
5. Fix any bugs found
6. Optimize slow queries

**Acceptance Criteria**:
- ✓ No critical bugs
- ✓ Performance acceptable
- ✓ Works on Chrome, Firefox, Safari
- ✓ Mobile responsive

---

### **Phase 12: Deployment** (1-2 days)
**Goal**: Deploy to production

#### Backend Deployment
**Tasks**:
1. Set environment variables on Render/Railway
2. Connect to Neon DB
3. Deploy backend
4. Test production endpoints
5. Monitor logs

#### Frontend Deployment
**Tasks**:
1. Update `VITE_API_BASE_URL` for production
2. Build optimized bundle: `npm run build`
3. Deploy to Vercel
4. Test production app
5. Verify API calls work

**Acceptance Criteria**:
- ✓ Backend deployed and accessible
- ✓ Frontend deployed and accessible
- ✓ Database connected
- ✓ API calls work across domains (CORS configured)
- ✓ No console errors

---

## 📊 Final Success Checklist

After all phases complete:

- [ ] **File Upload**: User can upload PDFs/PPTs
- [ ] **Parsing**: Files parsed and stored in database
- [ ] **Curriculum**: Shows modules and subtopics from database
- [ ] **Teaching**: Gemini generates teaching blocks
- [ ] **Simulations**: HTML simulations render and work
- [ ] **Questions**: Multiple questions per subtopic
- [ ] **Scoring**: Attempts tracked, scores calculated
- [ ] **Camera** (optional): Tracks attention metrics
- [ ] **Color Markers**: Visual confidence indicators
- [ ] **Skip**: Can skip subtopics
- [ ] **Regenerate**: Can regenerate content with cooldown
- [ ] **Prefetching**: Next subtopic loads fast
- [ ] **Module Locking**: Sequential unlock at 100%
- [ ] **Caching**: Fast load times
- [ ] **Mobile**: Works on phone/tablet
- [ ] **Deployed**: Live on internet

---

## 🚀 Total Timeline Estimate

- **Phase 1-2** (Database + Curriculum API): 3-5 days
- **Phase 3** (Frontend Curriculum): 2 days
- **Phase 4-5** (Teaching Content Backend + Frontend): 6-7 days
- **Phase 6-7** (Scoring Backend + Frontend): 3-4 days
- **Phase 8** (UI Polish): 2 days
- **Phase 9** (Camera): 3-4 days
- **Phase 10** (Module Logic): 1-2 days
- **Phase 11** (Testing): 2-3 days
- **Phase 12** (Deployment): 1-2 days

**Total**: ~25-32 days (3.5-4.5 weeks)

---

## 💡 Pro Tips

1. **Start Simple**: Get Phase 1-3 working first (curriculum display from DB)
2. **Test Often**: Test each endpoint with Postman before frontend integration
3. **Commit Frequently**: Git commit after each feature
4. **Use DevTools**: React Query DevTools and browser console are your friends
5. **Mock First**: If blocked on Gemini, mock the response and continue
6. **Parallel Work**: Frontend and backend can be developed in parallel for some phases
7. **Ask for Help**: If stuck for >1 hour, ask for clarification

---

**Ready to Start?** Begin with **Phase 1: Database Foundation** 🚀

**Document Version**: 1.0  
**Last Updated**: 2026-01-23  
**Next Review**: After Phase 6 completion
