# Orbit 🪐

**The Intelligent, Adaptive Study Companion.**

Orbit is a next-generation education platform that adapts to *you*. By combining real-time engagement tracking, AI-generated interactive content, and robust accessibility features, Orbit creates a personalized learning environment that evolves with your needs.

![Orbit App Screenshot](https://github.com/user-attachments/assets/placeholder) 
*(Add actual screenshot here)*

## 📖 About The Project

For the full story behind Orbit, including our inspiration, challenges, and future plans, check out [**ABOUT.md**](./ABOUT.md).

## ✨ Key Features

-   **📄 Smart Decomposition**: Upload PDFs/text and get structured, bite-sized modules.
-   **🎯 Adaptive Learning**: Content adapts based on your quiz scores and real-time engagement.
-   **👁️ Engagement Tracking**: Uses client-side computer vision (MediaPipe) to detect confusion or focus.
-   **🔬 Interactive Simulations**: AI-generated simulations to visualize complex topics.
-   **🗣️ Voice-First Accessibility**: Full navigation and interaction via voice for visually impaired users.
-   **🔁 Smart Revision**: Targeted revision sessions based on your "lagging" topics.

## 🛠️ Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Threejs](https://img.shields.io/badge/Threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
*   **Framework**: React (Vite)
*   **State**: TanStack Query
*   **UI**: Shadcn/UI, Framer Motion

### **Backend**
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
*   **Server**: FastAPI (Uvicorn)
*   **AI**: Google Gemini, Spacy, MediaPipe
*   **TTS**: Piper (WASM)
*   **DB**: Neon Tech (PostgreSQL)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   PostgreSQL Database

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/shivanshv45/Orbit.git
    cd Orbit
    ```

2.  **Setup Backend**
    ```sh
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    ```

3.  **Setup Frontend**
    ```sh
    cd frontend
    npm install
    ```

4.  **Run Development Servers**
    *   Backend: `python run_server.py`
    *   Frontend: `npm run dev`

---

## 📂 Documentation

-   [**Frontend Details**](./frontend/README.md)
-   [**Backend Details**](./backend/README.md)

