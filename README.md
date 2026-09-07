# D:Code

A competitive coding platform where developers duel head-to-head in real time.
Think LeetCode meets a fighting game — timed, live, and against a real opponent.

## Stack

- React 19 + Vite 8
- Tailwind CSS v4
- lucide-react icons
- Monaco Editor
- Judge0

## Getting Started

```bash
npm install
npm run dev
```

## What's built

The full frontend is complete across 10 pages.

- **Dashboard** — stat cards, recent duels, daily challenge, activity chart
- **Problems** — search, difficulty and topic filters, daily challenge banner
- **Leaderboard** — global, friends, and weekly rankings with tier badges
- **Profile** — stats, achievements, activity feed, rating history
- **Match history** — past duels and solved problems
- **Friends** — friends list, incoming requests, suggested players
- **Settings** — account info, editor preferences, notifications, privacy
- **Puzzles** — daily coding puzzles with answer feedback
- **Solve workspace** — Monaco editor with problem panel and test runner
- **Ranked duel** — live countdown timer, opponent telemetry, submission flow

## In progress

Backend is next. Planning to build with FastAPI + PostgreSQL.

- [ ] Auth — register, login, JWT
- [X] Problems API
- [X] User profiles and match history
- [X] WebSocket duel engine
- [X] Code execution sandbox

*Test harness issue priority*