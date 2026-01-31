# Orbit Frontend Engineering

> Premium educational interface built with React 18, TypeScript, and Vite.

## ⚡ Core Technical Features

### 1. Adaptive Learning Interface
- **Dynamic Content Rendering**: `TeachingCanvas` uses a block-based architecture to render heterogenous content (text, math, code, interactive simulations) derived from AI responses.
- **Interactive Simulations**: `SimulationBlock` implements a sandboxed runtime for AI-generated HTML/CSS/JS experiments. Features automatic script extraction, isolation, and safe execution within React's lifecycle.
- **Real-time Engagement**: `useFaceTracking` integrates Google MediaPipe for client-side attention monitoring and engagement scoring.
- **Voice Control**: Full-duplex voice interaction using Web Speech API (`useVoiceMode`) for hands-free learning navigation.

### 2. Advanced Session Management
- **Hybrid Auth System**: Seamlessly handles both ephemeral Guest users (local UUIDs) and Authenticated users (Clerk).
- **Session Preservation**: 
  - Custom `SessionObserver` logic automatically snapshots Guest state before login.
  - on Sign-out, intelligently restores the previous Guest session/curriculum instead of resetting to a blank state.
  - Implements aggressive cache invalidation in `userSession.ts` to prevent data cross-talk.

### 3. Revision & Testing Module
- **4-Phase Modal Architecture**: Implemented `RevisionModal` handling Loading → Note Review → Interactive Testing → Result Analysis states.
- **Client-Side Scoring Logic**: 
  - Adaptive scoring decay: 100% (1st try) → 75% → 50% → 25%.
  - Local state management for immediate feedback loops before async persistence.

### 4. Application Architecture
- **State Management**: Heavily leverages `@tanstack/react-query` for server-state synchronization with optimistic updates.
- **Route-based Lazy Loading**: Optimized chunking for `Landing`, `Curriculum`, and `Learn` flows.
- **Optimized Assets**: Framer Motion for GPU-accelerated layout transitions and micro-interactions.
