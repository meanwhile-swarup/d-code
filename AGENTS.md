# AGENTS.md

## Stack

### Frontend
- React 19 + Vite 8, JSX (no TypeScript)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (not the PostCSS approach)
- Linter: **oxlint** (not ESLint) — configured in `.oxlintrc.json`
- No router — page navigation is manual state in `App.jsx`
- Custom SVG icon library: `src/Components/ui/Icons.jsx` (SwordsIcon, CrownIcon, TrophyIcon, ShieldIcon, FlameIcon, LightningIcon, BrainIcon, TargetIcon, GamepadIcon, HandshakeIcon, MedalIcon, GaugeIcon, FlaskIcon, CodeIcon, TimerIcon, UsersIcon, ClockIcon)
- `@iconify/react` and `react-icons` are NOT installed — use lucide-react for standard UI icons and custom Icons.jsx for thematic icons

### Backend
- Python FastAPI + uvicorn on port 8000
- PostgreSQL via SQLAlchemy ORM (`dcode` database)
- JWT auth (python-jose, HS256, 7-day expiry)
- Node.js subprocess judge for JavaScript execution
- ELO rating system (K=32)

## Commands

```
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build (vite build)
npm run lint       # Run oxlint
npm run preview    # Preview production build
```

### Backend
```
cd server && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

No test runner is configured. No typecheck step (plain JSX).

## Structure

### Frontend
- `src/main.jsx` — entry point, renders `<App />`
- `src/App.jsx` — state-driven page switching (dashboard, problems, solve, duel, leaderboard, profile, settings, history, friends, puzzles)
- `src/Components/` — feature folders: Dashboard, Duel, Leaderboard, Problems, Profile, Settings, History, Friends, Puzzles
- `src/Components/ui/Icons.jsx` — custom SVG icon components
- `src/api/client.js` — API client for FastAPI backend (auth, users, problems, execute, leaderboard, duels, friends, puzzles, achievements, activity, submissions)
- `src/contexts/AuthContext.jsx` — JWT auth context (login, signup, logout, setUser)
- `src/index.css` — Tailwind import + custom font/scrollbar theme

### Backend
- `server/main.py` — FastAPI app entry point with all routes
- `server/database.py` — PostgreSQL SQLAlchemy engine + session
- `server/models.py` — All ORM models
- `server/schemas.py` — Pydantic request/response schemas
- `server/auth.py` — JWT auth utilities
- `server/seed.py` — Database seeding (11 users, 18 problems, 6 puzzles, 10 achievements)
- `server/judge.py` — Node.js subprocess judge
- `server/scoring.py` — Correctness curve, speed bonus, tier classification
- `server/rating.py` — ELO rating system K=32
- `server/formats.py` — Duel format definitions

## Conventions

- Tailwind utility classes used directly in JSX; dark zinc/violet palette (`bg-[#111113]`, `bg-slate-950`)
- Custom fonts loaded via Google Fonts in `index.html`: Plus Jakarta Sans (sans) + JetBrains Mono (mono)
- Components use `.jsx` extension, not `.tsx`
- Pages that are full-screen (Duel, Solve) render without the Sidebar; all others render inside the Sidebar layout
- Stat cards, tables, and section headers follow consistent patterns — match existing code before adding new patterns
- `font-mono` is ONLY for actual data values (ratings, scores, code), never for UI labels
- Violet accent color must not exceed 15% of screen real estate
- Custom icons: use `icon-filled` class for filled variants, `icon-glow` for hover effects

## API Endpoints

All endpoints return `{ data: ... }` wrapper. The API client auto-unwraps this.

- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login, returns JWT + user
- `GET /api/auth/me` — Get current user
- `PUT /api/users/:id` — Update user profile
- `GET /api/problems` — List problems (optional ?difficulty=easy)
- `GET /api/problems/:id` — Get problem with test cases
- `POST /api/execute` — Run/submit code against test cases
- `GET /api/execute/solved` — Get solved problems list
- `GET /api/leaderboard` — Global leaderboard
- `GET /api/leaderboard/weekly` — Weekly leaderboard
- `GET /api/leaderboard/friends` — Friends leaderboard
- `GET /api/duels` — List user's duels
- `POST /api/duels` — Create/join duel
- `GET /api/friends` — List friends + pending requests
- `POST /api/friends/:id/request` — Send friend request
- `POST /api/friends/:id/accept` — Accept friend request
- `DELETE /api/friends/:id` — Remove friend
- `GET /api/puzzles` — List daily puzzles
- `GET /api/puzzles/daily` — Get today's puzzle
- `POST /api/puzzles/:id/attempt` — Submit puzzle answer
- `GET /api/achievements` — List achievements
- `GET /api/activity` — Get activity feed

## Project Context

See `PROJECT.md` for feature progress, roadmap, and mock data inventory.
