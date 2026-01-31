# Orbit System Documentation

Technical overview of the Orbit Adaptive Learning Platform architecture.

## 📐 High-Level Architecture

### Data Flow Pipeline
1.  **Ingestion**: `PDF/DOCX` -> **Frontend** -> **Backend API** -> **Unstructured API** -> **Semantic Splitter** -> **PostgreSQL**.
2.  **Learning**: **Frontend Request** -> **Cache Check (DB)** -> *(Miss)* -> **Gemini AI (Context+Prompt)** -> **JSON Structure** -> **Frontend Renderer**.
3.  **Revision**: **Score Tracking** -> **Milestone Trigger** -> **Weakness Aggregation** -> **Targeted Generation** -> **Revision Modal**.

## 🧩 Key Technical Implementations

### Session & Identity
*   **Dual-State Identity**: System treats Guest UUIDs and Clerk Authenticad IDs as interchangeable primary keys.
*   **Session State Machine**: Frontend `SessionObserver` acts as a state machine, managing transitions: `Guest -> Auth (Merge/Save) -> Guest (Restore)`.
*   **Cache Invalidation**: Strict logic enforces data isolation; local storage changes instantly trigger re-fetches via React Query invalidation.

### AI & Content
*   **Prompt Engineering**: Context-aware prompts inject "Previous Subtopic" data to prevent hallucinations and maintain flow.
*   **Resiliency**: Round-robin API key rotation handles rate limits at the application layer, not the infrastructure layer.
*   **Sandboxing**: Client-side execution of AI-generated code (`<script>`) is handled via functional isolation to prevent global scope pollution.

### Database Design Patterns
*   **Hybrid Storage**: Relational columns for structure/indexing (`uuid`, `position`, `score`) mixed with NoSQL-style `JSONB` for content blocks (`teaching_content`).
*   **Derived Metrics**: Scores are calculated simply on the client but aggregated effectively on the backend to drive the Revision Engine logic.
