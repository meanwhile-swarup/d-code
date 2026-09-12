# D:CODE — Developer Runtime Arena

A competitive coding platform where developers duel in real-time, solve problems, climb leaderboards, and earn achievements. Think LeetCode meets fighting game.

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | React 19 + Vite 8 | |
| Styling | Tailwind CSS v4 | Vite plugin, not PostCSS |
| Linting | oxlint | `.oxlintrc.json` config |
| Icons | lucide-react | |
| Language | JSX (frontend), TypeScript (backend) | |
| Routing | Manual state | `App.jsx` useState, no router library |
| Backend | Node.js + Hono | Lightweight, edge-ready |
| Database | SQLite + Drizzle ORM | Simple, zero-config |
| Auth | JWT + bcrypt | Self-hosted |
| Realtime | WebSocket (ws) | Duel engine, live lobby |
| Code Exec | In-browser sandbox | `new Function()` for JS evaluation |

---

## Current Status

**12 pages built. Full backend API. Real-time WebSocket duels. Client-side code execution.**

### Frontend Pages (12)

| Page | Status | Navigation |
|------|--------|------------|
| Dashboard | Done | Sidebar "Home" |
| Problems | Done | Sidebar "Problems" |
| Solve Workspace | Done | Click problem → full-screen |
| Ranked Duel | Done | Sidebar "Duel" → full-screen |
| Casual Duel | Done | Dashboard "Casual Duel" → full-screen |
| Custom Room | Done | Dashboard "Custom Room" → full-screen |
| Leaderboard | Done | Sidebar "Leaderboard" |
| Friends | Done | Sidebar "Friends" |
| Puzzles | Done | Sidebar "Puzzles" |
| History | Done | Sidebar "History" |
| Profile | Done | Sidebar "Profile" |
| Settings | Done | Sidebar "Settings" |
| Login/Signup | Done | Auto when not logged in |

### Backend API (16 routes)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/login` | POST | Authenticate |
| `/api/auth/me` | GET | Current user profile |
| `/api/users/:id` | GET/PUT | User profile CRUD |
| `/api/problems` | GET | List with filters |
| `/api/problems/:id` | GET | Single problem |
| `/api/execute` | POST | Run/submit code |
| `/api/leaderboard` | GET | Global leaderboard |
| `/api/leaderboard/weekly` | GET | Weekly leaderboard |
| `/api/leaderboard/friends` | GET | Friends leaderboard |
| `/api/duels` | GET/POST | Duel history/create |
| `/api/friends` | GET | Friends list |
| `/api/puzzles/daily` | GET | Daily puzzle |
| `/api/puzzles/:id/attempt` | POST | Submit puzzle answer |
| `/api/achievements` | GET | User achievements |
| `/api/activity` | GET | Activity feed |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connected` | Server→Client | Connection confirmed |
| `find_match` | Client→Server | Join matchmaking queue |
| `match_found` | Server→Client | Match found, includes roomId |
| `join_room` | Client→Server | Join a duel room |
| `duel_start` | Server→Client | Duel begins |
| `duel_code` | Client→Server | Code update (telemetry) |
| `duel_submit` | Client→Server | Submit solution |
| `duel_result` | Server→Client | Winner determined |
| `leave_room` | Client→Server | Leave room |
| `error` | Server→Client | Error message |

---

## How to Run

### Frontend
```bash
npm run dev        # Vite dev server on :5173
npm run build      # Production build
```

### Backend
```bash
cd server
npm install        # Install dependencies
npx tsx src/index.ts  # Start server on :8000
```

### Both Together
```bash
# Terminal 1: Backend
cd server && npx tsx src/index.ts

# Terminal 2: Frontend
npm run dev
```

### Demo Credentials
- Email: `alex@example.com`
- Password: `password123`

---

## File Structure

```
d-code/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api/
│   │   └── client.js
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── utils/
│   │   └── badges.js
│   ├── Components/
│   │   ├── Auth/
│   │   │   └── LoginSignupPage.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── Duel/
│   │   │   ├── DuelPage.jsx
│   │   │   ├── CasualDuelPage.jsx
│   │   │   └── CustomRoomPage.jsx
│   │   ├── Problems/
│   │   │   ├── ProblemsPage.jsx
│   │   │   └── SolveWorkspace.jsx
│   │   ├── Leaderboard/
│   │   │   └── LeaderboardPage.jsx
│   │   ├── Friends/
│   │   │   └── FriendsPage.jsx
│   │   ├── Puzzles/
│   │   │   └── PuzzlesPage.jsx
│   │   ├── History/
│   │   │   └── HistoryPage.jsx
│   │   ├── Profile/
│   │   │   └── ProfilePage.jsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.jsx
│   │   └── ui/
│   │       ├── ErrorBoundary.jsx
│   │       ├── MonacoEditor.jsx
│   │       └── OutputTerminal.jsx
│   └── data/
│       ├── dashboardData.js
│       ├── friendsData.js
│       ├── historyData.js
│       ├── leaderboardData.js
│       ├── profileData.js
│       ├── puzzlesData.js
│       └── settingsData.js
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env.example
│   └── src/
│       ├── index.ts
│       ├── db/
│       │   ├── index.ts
│       │   ├── schema.ts
│       │   └── seed.ts
│       ├── middleware/
│       │   └── auth.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── users.ts
│       │   ├── problems.ts
│       │   ├── submissions.ts
│       │   ├── leaderboard.ts
│       │   ├── duels.ts
│       │   ├── friends.ts
│       │   ├── puzzles.ts
│       │   ├── achievements.ts
│       │   └── activity.ts
│       └── ws/
│           └── duel.ts
├── AGENTS.md
├── PROJECT.md
├── package.json
├── vite.config.js
└── .oxlintrc.json
```
