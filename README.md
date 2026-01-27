# AI Nursing Care Plan Generator

A web application that leverages AI to generate and explain Nursing Care Plans (NCPs) based on NANDA-I, NIC, and NOC standards.

## Features

- **AI-Generated NCPs** - Generate structured nursing care plans using advanced AI models compliant with NNN standards
- **Educational Support** - Detailed explanations for each NCP component
- **Flexible Display** - Choose between 4, 5, 6, or 7-column formats
- **Dark Mode** - Light and dark theme support
- **Responsive Design** - Optimized for desktop and mobile devices

## Tech Stack

| Layer    | Technologies                          |
| -------- | ------------------------------------- |
| Frontend | Vue 3, Vite, Tailwind CSS, ShadCN Vue |
| Backend  | FastAPI (Python)                      |
| Database | Supabase                              |
| AI       | Claude Sonnet, Google Gemini          |

## Prerequisites

- Node.js v16+
- Python 3.8+
- Supabase account
- Claude API key (Anthropic)
- Gemini API key (Google)

## Getting Started

### Frontend Setup

```bash
npm install
cp .env.example .env
```

Configure `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
```

Configure `backend/.env`:

```
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### Run the Application

```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
npm run dev
```

Visit `http://localhost:5173`

## Environment Variables

### Frontend

| Variable                 | Description            |
| ------------------------ | ---------------------- |
| `VITE_API_BASE_URL`      | Backend API URL        |
| `VITE_SUPABASE_URL`      | Supabase project URL   |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Backend

| Variable         | Description               |
| ---------------- | ------------------------- |
| `CLAUDE_API_KEY` | Anthropic Claude API key  |
| `GEMINI_API_KEY` | Google Gemini API key     |
| `SUPABASE_URL`   | Supabase project URL      |
| `SUPABASE_KEY`   | Supabase service role key |

## Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `npm run dev`     | Start development server  |
| `npm run build`   | Build for production      |
| `npm run preview` | Preview production build  |
| `npm run lint`    | Run ESLint                |
| `npm run format`  | Format code with Prettier |

