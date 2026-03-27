# SmartCare: AI Nursing Care Plan Generator

SmartCare helps nursing students generate and understand Nursing Care Plans (NCPs) aligned with NANDA-I, NIC, and NOC (NNN) standards.

## Live App

Use the app here: https://ai-ncp-generator.vercel.app/

## Key Features

- **Standards-Grounded NCP Generation**  
  The app generates Nursing Care Plans by combining AI reasoning with a terminology lookup layer built from structured extracts of official NANDA-I, NIC, and NOC references—helping keep diagnoses, interventions, and outcomes aligned with NNN standards.

- **Smart Clinical Matching Workflow**  
  During generation, patient assessment inputs are analyzed and mapped to relevant diagnosis/intervention/outcome candidates from lookup tables before the final plan is drafted, improving consistency and reducing off-standard suggestions.

- **Explainable, Learning-Focused Output**  
  Each NCP component includes clear explanations so users can understand _why_ items were selected, making the tool useful not only for drafting but also for study and clinical reasoning practice.

- **Flexible Presentation for Different Requirements**  
  View plans in 4, 5, 6, or 7-column formats to match classroom, institutional, or documentation preferences.

## Tech Stack

| Layer    | Technologies                             |
| -------- | ---------------------------------------- |
| Frontend | Vue 3, Vite, Tailwind CSS, shadcn-vue    |
| Backend  | FastAPI (Python)                         |
| Database | Supabase                                 |
| AI       | Claude Sonnet 4.5, Gemini 2.5 Pro, GPT-5 |

## Project Structure

- [src/](src/) — Vue frontend
- [backend/](backend/) — FastAPI backend
