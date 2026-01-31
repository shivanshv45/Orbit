# Orbit Backend Engineering

> High-performance async API built with FastAPI, Python 3.12, and PostgreSQL.

## 🧠 AI & Parsing Pipelines

### 1. Intelligent Content Parsing
- **Hybrid Extraction Engine**: Combines `Unstructured.io` for layout analysis with custom heuristic post-processing.
- **Semantic Splitting Algorithm** (`manual_parsing.py`):
  - Uses `Spacy` (NLP) to calculate vector cosine similarity between adjacent subtopics.
  - Dynamically slices content into Modules based on semantic drift and balanced distribution (2-6 subtopics/module).
  - Cleaning pipeline using `ftfy` to normalize text encodings and remove artifacts.

### 2. Adaptive Teaching Engine (`Gemini_Services/`)
- **Multi-Model Fallback Architecture**:
  - Primary: `gemini-3-flash-preview` (Higher reasoning).
  - Fallback: `gemini-2.5-flash` (Retries on quota/latency errors).
- **Key Rotation System**: `GeminiKeyManager` implements a circular buffer for API keys, automatically handling `429 Resource Exhausted` errors transparently.
- **Dynamic Context Injection**: Retrieval system fetches neighboring subtopic context to ensure AI teaching continuity.

### 3. Revision System
- **Milestone Detection**: Automated triggers at 25%, 50%, 75%, and 100% curriculum completion.
- **Weakness Analysis**: Aggregates `subtopic.score` data to identify lowest-performing knowledge areas.
- **Targeted Generation**: Synthesizes specialized "Revision Notes" and "Review Questions" specifically targeting identified weak points.

## 🏗️ System Architecture

### Data Persistence
- **Schema**: Relational hierarchy `Users -> Curriculums -> Modules -> Subtopics`.
- **Teaching Cache**: `teaching_blocks` uses `JSONB` storage to cache complex, structured AI responses, eliminating redundant generation costs.
- **Optimized SQL**: Raw `SQLAlchemy` Core usage for complex aggregation queries (scoring/metrics).

### API Design
- **Stateless Session Handling**: Pure REST architecture; Session identity resolved via `X-User-Id` headers (supporting both Auth/Guest UUIDs uniformly).
- **Async I/O**: Fully asynchronous route handlers for non-blocking database and external API operations.
