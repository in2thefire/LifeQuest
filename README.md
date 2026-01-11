# LifeForge Habit Tracker

## Local setup
1) Create `server/.env` from `server/.env.example`.
2) Ensure PostgreSQL is running and `DATABASE_URL` is valid.
3) Install backend dependencies:
   - `cd server`
   - `npm install`
4) Generate Prisma client and run migrations:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
5) Start the API:
   - `npm run dev`
6) Open `index.html` with a static server (Live Server, `python -m http.server`, etc).

## Environment variables
Defined in `server/.env.example`:
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_ORIGIN` (comma-separated list of allowed origins)
- `PORT`

## Frontend API base
By default the frontend uses `http://localhost:4000`. Override by setting
`window.API_URL` before `app.js` loads (already included in `index.html`).

## Prisma models (summary)
- `User`: auth identity.
- `UserProgress`: XP total, level, forge coins, rank (1:1 with User).
- `Habit`: per-user habits with type, difficulty, color, schedule.
- `HabitLog`: daily status entries per habit with awarded XP/coins.
- `Todo`: short-term tasks with priority-based rewards and completion state.
- `FocusSession`: focus timer sessions with duration, completion state, and awarded XP/coins.

## Modules
- Habits: long-term identity shaping with streaks and daily logs.
- To-Do: short-term execution and intent; toggles completion and resets daily when marked as Daily.
- Focus: Pomodoro-style focus sessions with a daily journal, Flow Chain tracking, and separate caps.

## Habit Stats
- Per-habit stats modal with 30/90 day ranges, consistency trend, and streak summaries.
- Habits Dashboard view with rolling 7-day consistency lines per habit colored by habit color.
- Charts pull from range-scoped endpoints and fill missing days with zeroes.

## Reward balance
- Habits and To-Dos share the same daily caps (200 XP / 25 FC).
- To-Do rewards are fixed by priority (low/medium/high) and apply once per completion.
- Focus rewards only apply when sessions are completed and are capped at 100 XP / 5 FC per day.
- Flow Chain = consecutive days with at least one completed focus session.

## Backfill existing users
If you already have users in the database, run:
- `npm run backfill:progress`
