# AI Nursing Care Plan Generator

A web-based application that uses AI to generate, validate, and explain Nursing Care Plans (NCPs) while adhering to NANDA-I, NIC, and NOC standards.

## Features

- 🤖 **AI-Generated NCPs**: Generate structured nursing care plans using advanced AI models
- ✅ **NCP Validation**: Validate your NCPs against NANDA-I, NIC, and NOC standards
- 📚 **Educational Support**: Get detailed explanations for each NCP component
- 🎨 **Flexible Display**: Choose between 4, 5, 6, or 7-column formats
- 🌓 **Dark Mode**: Support for light and dark themes
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN Vue
- **Icons**: Lucide Icons
- **Backend**: FastAPI (Python)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-ncp-generator.git
cd ai-ncp-generator
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

4. Open your browser and visit: `http://localhost:5173`

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
