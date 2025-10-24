# AI Nursing Care Plan Generator

A web-based application that uses AI to generate and explain Nursing Care Plans (NCPs) while adhering to NANDA-I, NIC, and NOC standards.

## Features

- 🤖 **AI-Generated NCPs**: Generate structured nursing care plans using advanced AI models that adheres to NNN standards.
- 📚 **Educational Support**: Get detailed explanations for each NCP component.
- 🎨 **Flexible Display**: Choose between 4, 5, 6, or 7-column formats.
- 🌓 **Dark Mode**: Support for light and dark themes.
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **UI Components**: ShadCN Vue
- **Icons**: Lucide Icons
- **Backend**: FastAPI (Python)
- **Database**: Supabase
- **AI Models**: Claude Sonnet 4.5, Google Gemini

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- npm or pnpm
- Supabase account
- Claude API key (from Anthropic)
- Gemini API key (from Google)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-ncp-generator.git
cd ai-ncp-generator
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your configuration:
# VITE_API_BASE_URL=http://localhost:8000
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add your API keys:
# CLAUDE_API_KEY=your_claude_api_key
# GEMINI_API_KEY=your_gemini_api_key
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_service_role_key
```

### 4. Run the Application

**Start the backend server:**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Start the frontend development server:**

```bash
# In a new terminal
npm run dev
```

Open your browser and visit: `http://localhost:5173`

## Production Deployment

### Frontend Deployment

1. **Build the application:**

```bash
npm run build
```

2. **Configure environment variables** in your hosting platform (Vercel, Netlify, etc.):

   - `VITE_API_BASE_URL`: Your production backend URL
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Deploy** the `dist` folder to your hosting service

### Backend Deployment

1. **Update CORS origins** in `backend/main.py`:

   ```python
   origins = [
       "https://your-production-domain.com",
       # Add your frontend URLs
   ]
   ```

2. **Set environment variables** on your hosting platform (Render, Railway, etc.):

   - `CLAUDE_API_KEY`
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

3. **Deploy** using your preferred Python hosting service

4. **Recommended hosting options:**
   - Railway
   - Render
   - Fly.io
   - Google Cloud Run
   - AWS Lambda

### Environment Variables Reference

#### Frontend (.env)

| Variable                 | Description                   | Required |
| ------------------------ | ----------------------------- | -------- |
| `VITE_API_BASE_URL`      | Backend API URL               | Yes      |
| `VITE_SUPABASE_URL`      | Supabase project URL          | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes      |

#### Backend (backend/.env)

| Variable         | Description                          | Required |
| ---------------- | ------------------------------------ | -------- |
| `CLAUDE_API_KEY` | Anthropic Claude API key             | Yes      |
| `GEMINI_API_KEY` | Google Gemini API key for embeddings | Yes      |
| `SUPABASE_URL`   | Supabase project URL                 | Yes      |
| `SUPABASE_KEY`   | Supabase service role key            | Yes      |

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Features in Detail

### AI-Generated NCPs

- Generate structured NCPs with:
  - Assessment
  - Diagnosis
  - Outcomes
  - Interventions
  - Rationale
  - Implementation
  - Evaluation

### NCP Validation

- Submit manually created NCPs for AI validation
- Get feedback on compliance with NNN standards
- Receive suggestions for improvements

### Educational Support

- Learn about each NCP component
- Understand the reasoning behind AI-generated plans
- Access detailed explanations of nursing concepts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Built with [Vue.js](https://vuejs.org/)
- UI components from [shadcn-vue](https://www.shadcn-vue.com/)
- Icons by [Lucide](https://lucide.dev/)
