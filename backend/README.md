# Orbit Backend ⚙️

The intelligence engine powering Orbit. Handles AI processing, data persistence, and content generation.

## 🧱 Tech Stack

*   **Framework**: FastAPI
*   **Server**: Uvicorn
*   **Database**: PostgreSQL (via SQLAlchemy & Psycopg2)
*   **AI/LLM**: Google Gemini (`google-genai`)
*   **NLP**: Spacy
*   **TTS**: Piper (WASM)

## 🔧 Key Services

*   **`gemini_service.py`**: Interacts with Google's Gemini models for content generation.
*   **`piper_voice.py`**: Manages text-to-speech synthesis specifically for backend generation.
*   **`db_services/`**: Handles all database interactions and schema management.
*   **`parsing/`**: Uses `Unstructured` to ingest and process user uploaded files.

## 🚀 Setup & Run

1.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Set up environment variables (create `.env`):
    ```env
    DATABASE_URL=postgresql://...
    GEMINI_API_KEY=...
    # Add other keys as needed
    ```

4.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```
    Or use the helper script:
    ```bash
    python run_server.py
    ```
