# Development Guide

## Folder Structure

```
Breakpoint/
├── backend/          # Flask API
│   ├── app/
│   │   ├── engine.py       # LLM interaction, mood engine, report generation
│   │   ├── models.py       # Supabase client + SessionManager
│   │   ├── routes.py       # API route definitions
│   │   ├── utils.py        # Auth decorators, filler word analysis
│   │   ├── prompts.json    # Scenario prompt templates
│   │   └── templates/      # HTML templates for PDF export
│   ├── run.py              # Application entry point
│   ├── pyproject.toml      # Python dependencies (uv)
│   └── .env                # Environment variables
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # API client, Supabase client, utilities
│   │   ├── pages/          # Page components (Landing, Auth, Setup, Interview, Dashboard, Report)
│   │   ├── store/          # Zustand stores
│   │   ├── App.jsx         # App root with routing
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── Documents/        # Project documentation
│   ├── Overview.md
│   ├── api_Contract.md
│   ├── Database_Schema.md
│   ├── Design_System.md
│   ├── Development_guide.md
│   ├── Demo_script.md
│   └── Prompts.md
└── README.md
```

---

## Git Flow

- `main` — production-ready code
- `feature/*` — feature branches

Never push directly to main.

## Commit Style

```
feat:    New feature
fix:     Bug fix
refactor: Code restructuring
style:   CSS/styling changes
docs:    Documentation
```

## Coding Rules

- Keep components reusable.
- Keep functions small.
- Avoid duplicated logic.
- Comment only when necessary.
- Never hardcode secrets.

## Code Review Checklist

- Responsive layout
- Error handling
- Loading states
- Accessibility
- Mobile tested

## Running Locally

### Backend
```bash
cd backend
uv sync
uv run python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
