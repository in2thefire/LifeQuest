# LifeQuest

## Local dev (frontend + API)

- Start API: `cd server && npm install && npm run prisma:generate`
- Apply DB schema (local Postgres): `npm run migrate:deploy`
- Run API: `npm run dev`
- Open frontend: serve `index.html` on `http://localhost:5500` (or `127.0.0.1:5500`).

## Production notes

- Set `DATABASE_URL` to Neon/Postgres and run `npm run migrate:deploy` during deploy.
- Set `FRONTEND_ORIGIN` to the public frontend URL for CORS.
- Optionally set `window.API_URL` on the frontend to the production API URL.
