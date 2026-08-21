# AGENTS.md

## Project Structure

Separate `client/` and `server/` directories with **no root `package.json`**. Each must be managed independently.

```
client/   → React 19 + Vite 8 + Tailwind CSS 4 (ESM, "type": "module")
server/   → Express 4 + Mongoose 9 (CommonJS, "type": "commonjs")
```

## Dev Commands

```bash
# Server
cd server && npm install && npm run dev    # nodemon auto-restart
cd server && npm start                      # production (node server.js)

# Client
cd client && npm install && npm run dev     # Vite dev server on :5173
cd client && npm run build                  # production build → dist/
```

There is no test suite. There is no lint/typecheck script — only oxlint config exists in `client/.oxlintrc.json` but no script invokes it.

## Environment

**Server** (`server/.env`):
- `MONGO_URI` — MongoDB connection string. If omitted, falls back to hardcoded dev users (admin/member) with no DB.
- `JWT_SECRET` — Falls back to `"ganapathi_secret_key_2026"` if missing.
- `FRONTEND_URL` — Used for CORS whitelist.
- `PORT` — Defaults to 5000.

**Client**: Uses `VITE_API_URL` env var (defaults to `http://localhost:5000`). No `.env` file exists — set via shell or `.env` in `client/`.

## MongoDB Database Name

The server auto-appends a DB name if the `MONGO_URI` doesn't include one. The regex checks for `agraja-sangam` or `ganapati`. If your URI already contains one of these names, it's used as-is. See `server/server.js` `start()` function.

## Deployment

**Render.com** — defined in `render.yaml`:
- Backend: `server/` → `node server.js`, Starter plan, Oregon
- Frontend: `client/` → `npm run build`, static site with SPA rewrites
- Auto-deploys from `main` branch push.

**Docker** — `docker-compose.yml` runs mongo:6 + server + client (dev mode).

## API Pattern

All frontend API modules (`client/src/api/*.js`) follow the same structure:
1. Axios instance with `baseURL` from `VITE_API_URL`
2. Request interceptor attaches Bearer token from `localStorage`
3. Exported CRUD functions

Server routes use `protect` middleware (JWT verification) and `isAdmin` for admin-only endpoints.

## Disabled Features

Several features return **410 Gone** and have stub routes/controllers:
- Members (`/api/members`)
- Videos (`/api/videos`)
- Gallery (`/api/gallery`)

Routes and models exist but are intentionally disabled. Do not re-enable without explicit request.

## Gotchas

- **No TypeScript, no ESLint, no Prettier.** Plain JavaScript (JSX) throughout.
- **No test files exist.** Cannot verify changes with tests.
- **`intentionally-disabled.js`** in both `client/` and `server/` — these are demo kill-switches, not part of the app.
- **CORS whitelist** includes `*.onrender.com` — any Render subdomain is allowed.
- **Rate limiting**: 300 req/15min globally, 10 req/15min for auth routes.
- **Seed endpoint**: `POST /api/seed` (admin-only) clears and re-seeds all data.
- **Default users**: `admin`/`admin123` (Admin), `member`/`member123` (Member) — auto-seeded on first run if no users exist.
- **Frontend styles** mix dark glass-morphism and light gradient themes across pages — not uniform.
