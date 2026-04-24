# 🌾 Sahayak — Voice-to-Form Engine

> **"Sahayak" means "Helper" in Hindi.** A multilingual, AI-powered voice assistant that helps rural citizens fill government enrollment forms — hands-free, in their own language.

Built for **HackBLR** by Team VaaniPay.

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Core React framework & file-based routing |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Micro-animations for the Mic Orb & form field highlights |
| **Zustand** | Global state management (form data, session, SSE status) |
| **`@vapi-ai/web`** | Vapi browser SDK for voice call management |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API & webhook server |
| **TypeScript** (`tsx watch`) | Type-safe development with hot-reload |
| **Mongoose** | MongoDB ODM for Users, Registries & Submissions |
| **`@xenova/transformers`** | Local embedding generation (no OpenAI needed) |

### Infrastructure & AI
| Technology | Purpose |
|---|---|
| **Vapi.ai** | Voice AI orchestration (STT → LLM → TTS) |
| **Groq** (Llama 3 70B) | Ultra-fast LLM backend for conversational logic |
| **Deepgram** | Speech-to-Text (multilingual transcription) |
| **ElevenLabs** | Text-to-Speech (natural-sounding voice output) |
| **MongoDB** | Primary database for users, form schemas, submissions |
| **Qdrant** (Docker) | Vector database for RAG glossary & knowledge base |
| **ngrok** | Tunnels `localhost:4000` to a public HTTPS URL for Vapi webhooks |
| **Server-Sent Events (SSE)** | Real-time one-way push from Backend → Browser |

---

## 🌊 Data Flow — End to End

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│                                                                          │
│   1. User opens /form/[schemaId]                                         │
│   2. Frontend fetches the form schema from backend (MongoDB)             │
│   3. Frontend establishes SSE stream → /api/form-events?sessionId=xxx   │
│   4. Frontend registers sessionId → /api/register-session               │
│                                                                          │
│   5. User clicks "Start Communication"                                   │
│   6. Frontend calls /api/sync-webhook → backend patches the Vapi        │
│      assistant with the correct webhook URL + form fields               │
│   7. Frontend calls vapi.start(assistantId, { metadata: {sessionId} })  │
│   8. Vapi returns a callId; frontend calls /api/link-call to bind it     │
│                                                                          │
└───────────────┬──────────────────────────────────────────────┬──────────┘
                │  WebRTC Audio                                │ SSE Stream
                ▼                                              │ (EventSource)
┌───────────────────────────────┐                             │
│         VAPI.AI CLOUD         │                             │
│                               │                             │
│  ┌────────┐  ┌─────────────┐  │                             │
│  │Deepgram│→ │  Groq LLaMA │  │                             │
│  │  STT   │  │   3 (LLM)   │  │                             │
│  └────────┘  └──────┬──────┘  │                             │
│                     │         │                             │
│         Detects tool call     │                             │
│         update_form_field     │                             │
│                     │         │                             │
│  ┌──────────────────▼──────┐  │                             │
│  │      ElevenLabs TTS     │  │    POST /api/webhook/vapi   │
│  └─────────────────────────┘  ├────────────────────────────►│
│                               │   (via ngrok HTTPS tunnel)  │
└───────────────────────────────┘                             │
                                                              │
                                            ┌─────────────────▼──────────┐
                                            │       BACKEND (Express)     │
                                            │                             │
                                            │  1. Receives webhook        │
                                            │  2. Parses type="tool-calls"│
                                            │  3. Extracts {field, value} │
                                            │  4. Looks up sessionId from │
                                            │     callIdToSessionId map   │
                                            │  5. Calls                   │
                                            │     handleFormFieldUpdate() │
                                            │  6. Writes SSE event to the │
                                            │     matching Response stream │
                                            │                             │
                                            └─────────────────┬──────────┘
                                                              │
                                                              │ SSE data event
                                                              ▼
                                            ┌─────────────────────────────┐
                                            │       BROWSER (SSE Hook)    │
                                            │                             │
                                            │  useSSEFormUpdates.ts       │
                                            │  → Receives {field, value}  │
                                            │  → Calls store.updateField()│
                                            │  → Zustand triggers re-render│
                                            │  → Framer Motion animates   │
                                            │     the field highlight ✨  │
                                            └─────────────────────────────┘
```

---

## 📁 Project Structure

```
hackblr/
├── backend/
│   ├── src/
│   │   ├── index.ts            # Express app entry, /api/sync-webhook
│   │   ├── routes/
│   │   │   ├── vapi.ts         # SSE stream, webhook handler, session registry
│   │   │   ├── auth.ts         # User login/register (JWT)
│   │   │   ├── bank.ts         # Form schema (registry) CRUD
│   │   │   ├── client.ts       # Form submission endpoints
│   │   │   ├── knowledge.ts    # RAG knowledge base query
│   │   │   └── memory.ts       # Per-user conversation memory (Qdrant)
│   │   ├── models/
│   │   │   ├── User.ts         # MongoDB user schema
│   │   │   ├── FormSchema.ts   # Registry (form template) schema
│   │   │   └── Submission.ts   # Completed form submission schema
│   │   └── services/
│   │       ├── qdrant.ts       # Qdrant client & collection init
│   │       └── embeddings.ts   # Local embedding generation
│   ├── .env                    # Backend environment variables
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── auth/               # Login & Signup pages
│   │   ├── client/             # Registry selection dashboard
│   │   └── form/[schemaId]/    # Dynamic form enrollment page
│   ├── components/             # UI components (MicOrb, RegistryMonitor, etc.)
│   ├── hooks/
│   │   ├── useVapiCall.ts      # Starts/stops Vapi voice calls
│   │   └── useSSEFormUpdates.ts # Listens to backend SSE stream
│   ├── lib/
│   │   ├── formStore.ts        # Zustand global state
│   │   ├── authStore.ts        # Zustand auth state
│   │   └── vapiClient.ts       # Vapi SDK singleton
│   └── .env.local              # Frontend environment variables
│
├── docker-compose.yml          # Qdrant vector DB container
└── vapi-config/                # Vapi assistant config exports
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Docker Desktop (for Qdrant)
- Scoop (Windows) or Homebrew (macOS) package manager
- A Vapi.ai account & Groq API key

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd hackblr

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**`backend/.env`**
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://<your-ngrok-url>   # Updated on each ngrok start

VAPI_API_KEY=your_vapi_private_key
VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_ASSISTANT_ID=your_assistant_id

GROQ_API_KEY=your_groq_api_key

MONGO_URI=mongodb://127.0.0.1:27017/sahayak
JWT_SECRET=your_jwt_secret

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=                        # Leave blank for local Docker
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
```

### 3. Start Infrastructure

```bash
# Start Qdrant vector database
docker-compose up -d

# Install & configure ngrok (first time only)
scoop install ngrok
ngrok config add-authtoken <your_ngrok_token>
```

### 4. Start the Tunnel

```bash
# In a dedicated terminal — keep this running
ngrok http 4000
```

Copy the **Forwarding URL** (e.g. `https://abc123.ngrok-free.app`) and update `BACKEND_URL` in `backend/.env`.

### 5. Seed the Database

```bash
cd backend
npm run seed:registries   # Seeds PM-Kisan, KCC, PDS form schemas into MongoDB
npm run seed:qdrant       # Seeds glossary into Qdrant
```

### 6. Start the Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 How It Works (User Journey)

1. **Register / Login** at `/auth/signup`
2. **Select a Government Scheme** from the dashboard (PM-Kisan, KCC, PDS, etc.)
3. **Click "Initiate Communication"** on the form page
4. **Speak naturally** — the AI conducts a bilingual interview:
   - *"What is your name?"*
   - *"How many family members do you have?"*
   - *"What is your annual income?"*
5. **Watch the form fill itself** in real-time as the AI extracts and validates each field
6. **Review & Submit** — the form is saved to MongoDB as a submission

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Authenticate, returns JWT |
| `GET`  | `/api/bank/registries` | List all available form schemas |
| `GET`  | `/api/bank/registry/:id` | Get a specific form schema |
| `POST` | `/api/sync-webhook` | Patches Vapi assistant with webhook URL + fields |
| `POST` | `/api/register-session` | Registers the browser's SSE session ID |
| `POST` | `/api/link-call` | Binds a Vapi Call ID to a browser Session ID |
| `GET`  | `/api/form-events` | SSE stream — pushes `form_update` events to browser |
| `POST` | `/api/webhook/vapi` | Receives tool calls from Vapi AI (the bridge) |
| `POST` | `/api/client/submit` | Saves a completed form submission |

---

## 🌐 Supported Languages

The Sahayak assistant supports the following languages via Deepgram's multilingual transcription:
- 🇮🇳 **Hindi** (`hi-IN`)
- 🇮🇳 **Kannada** (`kn-IN`)
- 🇮🇳 **Telugu** (`te-IN`)
- 🇮🇳 **Tamil** (`ta-IN`)
- 🇬🇧 **English** (`en-IN`)

---

## 🧠 AI Architecture

```
User Speech → Deepgram (STT) → Groq Llama3-70B (LLM) → ElevenLabs (TTS) → User Ears
                                        │
                                 Tool Call Extraction
                                        │
                          update_form_field(field, value)
                                        │
                              POST /api/webhook/vapi
                                        │
                              SSE push to browser
                                        │
                                 Form field fills ✨
```

The LLM is instructed to **always call `update_form_field` immediately** after extracting any piece of information. This ensures zero-delay live form filling.

---

## 📦 Docker Services

```yaml
# docker-compose.yml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"     # REST API
      - "6334:6334"     # gRPC
    volumes:
      - qdrant_storage:/qdrant/storage
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Form fields not filling | Ensure ngrok is running and `BACKEND_URL` in `backend/.env` is updated |
| `502 Bad Gateway` in Vapi logs | Backend crashed — check terminal for errors |
| SSE shows "disconnected" | Restart frontend; check backend is on port 4000 |
| MongoDB connection failed | Ensure `mongod` service is running on `127.0.0.1:27017` |
| Qdrant not available | Run `docker-compose up -d` |
| `sharp` module error | Run `npm install --include=optional sharp` in backend |

---

## 📄 License

MIT © 2026 Team VaaniPay — HackBLR
