# Orbit - Documentation Overview

## 📚 Available Documentation Files

### 1. **README_TDT.md** - Technical Design & Architecture
**Purpose**: Complete technical specification of the system

**Contains**:
- System architecture diagrams
- Database schema (current + planned)
- Data flow diagrams
- API endpoint specifications
- Teaching block type definitions
- Scoring algorithms
- Camera integration details
- Gemini prompt engineering guide
- Caching strategy
- Performance optimizations
- Deployment architecture

**When to use**: Reference for understanding how any part of the system works

---

### 2. **IMPLEMENTATION_PLAN.md** - Detailed Implementation Steps
**Purpose**: Phase-by-phase breakdown of the entire project with detailed code examples

**Contains**:
- 7 major implementation phases
- Step-by-step tasks for each phase
- Code snippets and examples
- Database migration scripts
- API endpoint implementations
- Frontend integration guides
- Testing strategies
- Deployment checklist
- Success metrics

**When to use**: Follow this when implementing each feature (has actual code)

---

### 3. **FEATURE_ORDER.md** - Feature Implementation Sequence ⭐
**Purpose**: Ordered list of features from start to finish with acceptance criteria

**Contains**:
- 12 phases of development
- Specific features in each phase
- Files to create/modify
- Acceptance criteria for each feature
- Timeline estimates (25-32 days total)
- Final success checklist
- Pro tips for development

**When to use**: **START HERE** - This is your roadmap!

---

## 🚀 Quick Start Guide

### For Development:

1. **Read**: FEATURE_ORDER.md (know what to build and in what order)
2. **Reference**: README_TDT.md (understand how it should work)
3. **Implement**: IMPLEMENTATION_PLAN.md (see code examples)
4. **Build**: Follow FEATURE_ORDER.md phase by phase

### Current Status:
✅ File upload system
✅ Unstructured API parsing
✅ Manual parsing with semantic grouping
✅ Database (SQLite - needs migration to Neon DB)
✅ Gemini service foundation
✅ Frontend UI (using mock data)

### Next Immediate Steps:
1. Create Neon DB account → Get connection string
2. Follow **Phase 1** in FEATURE_ORDER.md
3. Test database connection
4. Move to **Phase 2**

---

## 🎯 Key Design Decisions (Clarified 2026-01-23)

1. **Curriculum Structure**: Flat (modules → subtopics directly, no virtual topics)
2. **Content Generation**: On-demand via Gemini + caching + prefetching next topic
3. **Questions**: 2-5 per subtopic, Gemini decides based on complexity
4. **Simulations**: Gemini generates complete HTML with inline CSS/JS
5. **Camera Scoring**: 70/30 split (questions/camera), camera optional
6. **Subtopic Status**: Score = confidence level, NOT completion
7. **Module Completion**: 100% of subtopics required, skip option available
8. **Gemini Model**: 2.0 Flash Experimental (AI Studio Pro)
9. **Regenerate**: 20-second cooldown
10. **Error Handling**: Show error message + retry button

---

## 📁 File Structure Reference

```
Orbit/
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── config.py                  # Settings (DB URL, API keys)
│   ├── routes/
│   │   ├── parse.py               # File upload endpoint ✅
│   │   ├── curriculum.py          # Curriculum API (to create)
│   │   ├── teaching.py            # Teaching content API (to create)
│   │   └── scoring.py             # Scoring & attempts API (to create)
│   ├── services/
│   │   ├── unstructured_service.py ✅
│   │   ├── manual_parsing.py      ✅
│   │   ├── garbage_removal.py     ✅
│   │   ├── curriculum_service.py  # (to create)
│   │   ├── teaching_service.py    # (to create)
│   │   ├── scoring_service.py     # (to create)
│   │   ├── Gemini_Services/
│   │   │   ├── gemini_service.py  ✅ (needs update)
│   │   │   └── teaching_prompt.py ✅ (needs update)
│   │   └── db_services/
│   │       ├── db.py              ✅
│   │       └── push_to_db.py      ✅
│   └── requirements.txt           ✅
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               ✅
│   │   ├── App.tsx                ✅
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx    ✅
│   │   │   ├── CurriculumPage.tsx ✅ (needs update)
│   │   │   └── LearnPage.tsx      ✅ (needs update)
│   │   ├── components/
│   │   │   ├── upload/
│   │   │   │   └── FileUploader.tsx ✅
│   │   │   ├── curriculum/
│   │   │   │   ├── CurriculumTree.tsx ✅ (needs update)
│   │   │   │   └── ColorMarker.tsx (to create)
│   │   │   ├── teaching/
│   │   │   │   ├── TeachingCanvas.tsx ✅ (needs update)
│   │   │   │   ├── QuestionBlock.tsx (to create)
│   │   │   │   └── AskAIChat.tsx  ✅
│   │   │   ├── layout/
│   │   │   │   ├── TopicNavigator.tsx ✅
│   │   │   │   └── ProgressIndicator.tsx ✅
│   │   │   └── practice/
│   │   │       └── PracticeQuestion.tsx ✅
│   │   ├── hooks/
│   │   │   ├── useCurriculum.ts   (to create)
│   │   │   ├── useTeachingContent.ts (to create)
│   │   │   ├── useScoring.ts      (to create)
│   │   │   └── useFaceTracking.ts (to create)
│   │   ├── lib/
│   │   │   ├── api.ts             (to create)
│   │   │   └── utils.ts           ✅
│   │   ├── logic/
│   │   │   └── userSession.ts     ✅
│   │   └── data/
│   │       └── mockCurriculum.ts  ✅ (keep but don't use)
│   └── package.json               ✅
│
├── README.md                      ✅ (main project description)
├── README_TDT.md                  ✅ (technical design doc)
├── IMPLEMENTATION_PLAN.md         ✅ (detailed implementation guide)
└── FEATURE_ORDER.md               ✅ (this roadmap!)
```

---

## ❓ Questions to Ask During Development

If you get stuck, check:

1. **"What does this feature do?"** → README_TDT.md (Architecture section)
2. **"How do I implement this?"** → IMPLEMENTATION_PLAN.md (find the phase)
3. **"What do I build next?"** → FEATURE_ORDER.md (follow the sequence)
4. **"How do I structure this API endpoint?"** → README_TDT.md (API Endpoints section)
5. **"What's the database schema?"** → README_TDT.md (Database Schema section)
6. **"How does scoring work?"** → README_TDT.md (Scoring System section)
7. **"What format should Gemini return?"** → README_TDT.md (Teaching Block Types + Gemini Prompt)

---

## 🎯 Success Criteria

You'll know Orbit is complete when:

✅ User can upload study materials  
✅ Files are parsed and curriculum appears  
✅ Clicking a subtopic shows Gemini-generated teaching content  
✅ Simulations render and are interactive  
✅ Questions track attempts and calculate scores  
✅ Color markers show confidence levels  
✅ Camera tracking works (optional)  
✅ Navigation is fast (caching + prefetching)  
✅ Regenerate content works with cooldown  
✅ Can skip subtopics  
✅ Modules unlock sequentially at 100%  
✅ Deployed and accessible on the internet  

---

## 🐛 Troubleshooting

**Database Issues**:  
→ Check connection string in `.env`  
→ Verify tables exist with `\dt` in psql  
→ Check indexes with `\di`

**API Not Responding**:  
→ Check FastAPI logs for errors  
→ Verify CORS settings in `main.py`  
→ Test endpoint with Postman first

**Gemini Errors**:  
→ Check API key is valid  
→ Verify prompt format matches schema  
→ Test with smaller content first  
→ Check JSON parsing errors

**Frontend Not Loading Data**:  
→ Check React Query DevTools  
→ Verify API_BASE_URL is correct  
→ Check network tab for failed requests  
→ Ensure query keys are unique

---

**Ready to Build?** → Open **FEATURE_ORDER.md** and start with Phase 1! 🚀

---

**Last Updated**: 2026-01-23  
**Version**: 1.0
