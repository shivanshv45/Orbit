# Orbit Frontend 🎨

The visual heart of Orbit. Built to be fast, premium, and deeply interactive.

## ⚡ Tech Stack

*   **Core**: React 18, Vite, TypeScript
*   **Styling**: Tailwind CSS, Shadcn/UI (Radix Primitives)
*   **Animations**: Framer Motion
*   **3D Graphics**: Three.js (@react-three/fiber, @react-three/drei)
*   **State Management**: TanStack Query
*   **Routing**: React Router DOM

## 🌟 Key Components

*   **`VoicePreferences.ts`**: Manages voice settings and TTS integration.
*   **`useFaceTracking.ts`**: Handles client-side webcam analysis via MediaPipe.
*   **`useVoiceMode.ts`**: Controls the accessibility voice navigation logic.
*   **Interactive Blocks**: Dynamic components that render simulations, quizzes, and content blocks.

## 🚀 Running Locally

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Build for production:
    ```bash
    npm run build
    ```

## 📐 Project Structure

```
src/
├── components/   # Reusable UI components
├── lib/          # Utilities, hooks, and helpers
├── pages/        # Main application pages
├── stores/       # Global state stores
└── types/        # TypeScript distinctions
```
