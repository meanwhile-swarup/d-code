# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite 8, Tailwind CSS v4 (Vite plugin), JSX, oxlint, lucide-react. Backend planned: Node.js + Hono, SQLite + Drizzle ORM, Better Auth, WebSocket (ws), Docker + VM2/Deno for code execution.

## Users

- **Competitive programmers** who actively practice for programming contests and want real-time head-to-head duels
- **Developers leveling up** who want to sharpen DSA skills through gamified, competitive practice
- **Students & learners** (CS students, bootcamp grads) learning data structures and algorithms through interactive challenges
- **Community builders** who want to connect with other developers, duel friends, and climb social leaderboards

## Product Purpose

D:CODE is a competitive coding platform where developers duel in real-time, solve algorithmic problems, climb leaderboards, and earn achievements. It exists to make coding practice social, competitive, and rewarding — turning solitary problem-solving into a live, spectator-friendly arena. Success means active daily duels, rising engagement on the leaderboard, and a community that returns not just to practice, but to compete.

## Positioning

Real-time PvP coding duels with live opponent telemetry. No other platform offers head-to-head timed coding with real-time visibility into opponent progress (submission count, test pass rate). LeetCode and CodeWars are solo-first with asynchronous comparison; D:CODE is built for the moment two developers are coding against each other simultaneously, with the tension and stakes of a fighting game.

## Operating Context

- Developers open D:CODE during study sessions, downtime, or competitive practice windows
- Core workflow: queue for a duel → match found → solve a problem under time pressure → submit → see results → check rank movement
- Secondary workflows: browse problem sets, solve puzzles daily, check leaderboard standings, manage friends and challenge them
- The duel workspace is a full-screen code editor experience; all other pages live inside a sidebar navigation
- Planned real-time features require WebSocket connectivity; offline use is limited to browsing problems and history

## Capabilities and Constraints

**Built (UI only, static mock data):**
- Dashboard with stats, duel cards, daily challenge, activity chart
- Ranked Duel page with countdown timer, code editor, run/submit mock, forfeit modal, opponent telemetry
- Problems page with search, filter by difficulty/topic, sort
- Solve Workspace with code editor and problem panel
- Leaderboard with 3 tabs (global/friends/weekly), search, tier badges
- Profile with stats, tier, achievements, activity feed
- Settings (account, editor prefs, notifications, privacy, theme)
- History with match history table and solved problems
- Friends with friends list, requests, suggested friends
- Puzzles with interactive quizzes and feedback

**Planned (not built):**
- Casual Duel mode and Custom Room
- Backend API, auth system, database
- WebSocket real-time duel engine
- Docker-based code execution sandbox
- Responsive mobile layout
- Animations, theme system, keyboard shortcuts, sound effects

**Known bugs:** 5 issues documented in PROJECT.md (data field mismatches, inconsistent backgrounds, unused imports)

**Constraints:**
- No TypeScript — all code is JSX
- No router library — page navigation is manual state in App.jsx
- Duel and Solve pages render full-screen without sidebar; all others render inside sidebar layout
- All current data is static mock; no real API calls yet

## Brand Commitments

None established. Visual identity is open for design.

## Evidence on Hand

- 10 fully built UI pages (~5,800 lines of custom code, 22 source files)
- 8 mock data files in `src/data/` with realistic sample data (35 leaderboard players, 18 problems, 6 puzzles, 10 match history records, etc.)
- PROJECT.md with complete feature roadmap (7 phases), database schema, API endpoints, and file structure
- Favicon and icon assets in `public/`
- Dark zinc/violet color palette established in existing code (`bg-[#111113]`, `bg-slate-950`)
- Google Fonts loaded: Plus Jakarta Sans (sans) + JetBrains Mono (mono)

## Product Principles

1. **Competition is the core loop.** Every feature should drive users toward dueling, comparing, and returning to compete again.
2. **Real-time creates stakes.** The live duel with visible opponent telemetry is the product's soul — protect it, amplify it, never dilute it.
3. **Gamification earns retention.** Ranks, achievements, XP, and seasonal leaderboards turn practice into progression.
4. **Social multiplies everything.** Friends, challenges, custom rooms, and community features make competition personal and sticky.
5. **Code quality is table stakes.** The code editor experience must feel professional — syntax highlighting, fast submission, clear feedback.

## Accessibility & Inclusion

No product-specific accessibility requirements established yet. Standard web accessibility expectations apply.
