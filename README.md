# Sahayak — Voice-to-Form Helper

Sahayak (Sanskrit for "Helper") is a multilingual, voice-first AI assistant designed for rural India. It bridges the digital divide by allowing citizens to fill complex government enrollment forms through natural voice conversations in their native language.

### Why Sahayak
- **Multilingual Support**: Hindi, Kannada, Telugu, Tamil, and English.
- **Voice-to-Form**: AI extracts structured data from speech in real-time.
- **Live UI Updates**: Form fields populate instantly via Server-Sent Events (SSE).
- **Privacy First**: Local-first vector storage for knowledge retrieval.
- **Hands-Free**: No typing required, just speak naturally.

### How It Works
1. **User Speaks**: The user initiates a voice call and explains their situation.
2. **AI Listens**: Vapi.ai (STT) + Groq Llama 3 (LLM) process the intent.
3. **Extraction**: The LLM calls tools to update specific form fields.
4. **SSE Push**: The backend pushes field updates to the browser instantly.
5. **Real-time UI**: The frontend highlights and fills the corresponding fields with smooth animations.

### 📺 Demo Video
[**Watch Sahayak in Action**](https://drive.google.com/file/d/1UW-Fu5CSsyosGFvw4aYicOFSkfZ83BbI/view)

### Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Node.js + Express, Mongoose, Qdrant (Vector DB).
- **AI/Voice**: Vapi.ai, Groq (Llama 3 70B), Deepgram, ElevenLabs.
- **Communication**: Server-Sent Events (SSE) for low-latency state synchronization.

### Repository Structure
- `app/`: Next.js 15 application (Pages, Layouts, API).
- `srv/`: Express backend (Models, Routes, Services).
- `lib/`: Shared utilities and global state stores.
- `hooks/`: Custom React hooks for voice and SSE.
- `vapi-config/`: Assistant configurations and system prompts.

### Setup (Local)
1. **Clone & Install**:
   ```bash
   npm install
   cd srv && npm install
   ```
2. **Database**:
   - Run MongoDB locally.
   - Run Qdrant via Docker: `docker-compose up -d`.
3. **Environment**:
   - Copy `.env.local` to `.env` in the root.
   - Setup `srv/.env` for the backend.
4. **Seed Data**:
   ```bash
   npm run seed
   ```

### Run Locally
```bash
# Terminal 1: Next.js Frontend
npm run dev

# Terminal 2: Express Backend
npm run dev:srv
```

### About
HackBLR Project | Team NeuroNova
Helping rural citizens navigate the digital world.
