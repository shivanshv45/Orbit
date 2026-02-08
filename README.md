# Orbit 🪐

**The Intelligent, Adaptive Study Companion.**

Orbit is a next-generation education platform that adapts to *you*. By combining real-time engagement tracking, AI-generated interactive content, and robust accessibility features, Orbit creates a personalized learning environment that evolves with your needs.

![Orbit App Screenshot]
<img width="1470" height="837" alt="Screenshot 2026-02-08 at 2 12 42 PM" src="https://github.com/user-attachments/assets/aa54c5a2-af9f-43ae-90c5-ad333a30aa27" />

<img width="1470" height="831" alt="Screenshot 2026-02-08 at 2 23 07 PM" src="https://github.com/user-attachments/assets/568cc522-9935-4877-8c67-e3524d6c13e2" />

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
   <img width="5805" height="3255" alt="Christmas Shopping Car Flow-2026-02-08-102345" src="https://github.com/user-attachments/assets/33206b44-a2fa-4cea-92ca-95d8c16a3c5b" />


### **Backend**
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
*   **Server**: FastAPI (Uvicorn)
*   **AI**: Google Gemini, Spacy, MediaPipe
*   **TTS**: Piper (WASM)
*   **DB**: Neon Tech (PostgreSQL)
<img width="8192" height="2737" alt="Christmas Shopping Car Flow-2026-02-08-102637" src="https://github.com/user-attachments/assets/da82fc61-5e23-467c-9493-8245e3f1fe44" />
<img width="3610" height="2780" alt="Christmas Shopping Car Flow-2026-02-08-102839" src="https://github.com/user-attachments/assets/0768f011-4a5b-44fe-99fd-b69f2fe7f65b" />
<img width="5959" height="6961" alt="Untitled diagram-2026-02-08-103047" src="https://github.com/user-attachments/assets/c5c86237-28bf-4e02-b4bc-506c56630714" />

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
-   [**Developer Docs**](./docs/README.md)

---
*Built with ❤️ by the Orbit Team*
