# Inventory & Order Management System

A small full-stack app for managing products, customers, and orders, with automatic stock tracking. Built for the technical assessment: React frontend, FastAPI backend, PostgreSQL database, fully containerized with Docker.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React (Vite), React Router, Axios
- **Containerization:** Docker, Docker Compose
- **Tests:** Vitest + React Testing Library (frontend), manual `curl` verification against a real Postgres instance (backend — see "What's been tested" below)

## Project structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, error handlers
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── models.py        # Product, Customer, Order, OrderItem
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── crud.py          # Business logic (stock checks, totals, etc.)
│   │   └── routers/         # products, customers, orders, dashboard
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Products, Customers, Orders, OrderDetail
│   │   ├── components/      # Modals, forms, layout, stock gauge
│   │   ├── api.js           # Axios client + endpoint wrappers
│   │   └── toast-context.js / ToastContext.jsx / useToast.js
│   ├── public/config.js     # Runtime API URL config (see below)
│   ├── nginx.conf
│   ├── docker-entrypoint.sh
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── .env.example
```

## Business rules implemented

- Product SKU and customer email are both enforced unique (409 on conflict).
- Quantity can never go negative — both at the API validation layer and in the order logic.
- Placing an order checks every line item's stock **before** changing anything; if any item is short, the whole order is rejected and nothing is deducted (no partial orders).
- Stock is deducted automatically when an order is created, using a row lock (`SELECT ... FOR UPDATE`) so two simultaneous orders can't both oversell the same item.
- The order total is calculated by the backend from each product's current price at order time — never trusted from the client.
- Cancelling an order (`DELETE /orders/{id}`) restores stock rather than just deleting history.
- Products/customers referenced by an existing order can't be deleted (409), to keep order history intact.
- The dashboard's "low stock" threshold is 10 units (see `LOW_STOCK_THRESHOLD` in `backend/app/crud.py`).

## Running locally without Docker

**Backend** (needs Python 3.12+ and a Postgres instance):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL if your Postgres setup differs
uvicorn app.main:app --reload
```

The API is now at `http://localhost:8000` (interactive docs at `/docs`).

**Frontend** (needs Node 18+):

```bash
cd frontend
npm install
npm run dev
```

The app is now at `http://localhost:5173` and talks to the backend at `http://localhost:8000` by default (see `public/config.js`).

**Frontend tests:**

```bash
cd frontend
npm test
```

## Running with Docker Compose

This brings up Postgres, the backend, and the frontend together — the easiest way to see the whole thing running on one machine.

```bash
cp .env.example .env   # adjust if you want different DB credentials
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

> **Note on `API_URL`:** this is the URL your **browser** will use to reach the backend, not a Docker-internal hostname. The default (`http://localhost:8000`) is correct when running `docker compose` on your own machine with the port mapping above. If you deploy the two containers to different hosts, set `API_URL` to wherever the backend actually ends up — see Deployment below.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `FRONTEND_ORIGIN` | backend | Comma-separated CORS allowlist (`*` for local dev) |
| `API_URL` | frontend container | Backend URL injected into the frontend at container **startup** (not build time) — see `frontend/docker-entrypoint.sh` |
| `VITE_API_URL` | frontend, local dev only | Override the backend URL when running `npm run dev`/`npm run build` outside Docker |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | docker-compose | Passed to both the `db` and `backend` services |

No credentials are hardcoded anywhere in the codebase — everything above is read from the environment, with safe local-dev defaults.

## API reference

| Method | Path | Description |
|---|---|---|
| POST | `/products` | Create a product |
| GET | `/products` | List products |
| GET | `/products/{id}` | Get a product |
| PUT | `/products/{id}` | Update a product |
| DELETE | `/products/{id}` | Delete a product |
| POST | `/customers` | Create a customer |
| GET | `/customers` | List customers |
| GET | `/customers/{id}` | Get a customer |
| DELETE | `/customers/{id}` | Delete a customer |
| POST | `/orders` | Create an order (deducts stock) |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Get an order with line items |
| DELETE | `/orders/{id}` | Cancel an order (restores stock) |
| GET | `/dashboard/summary` | Totals + low-stock list |

Full interactive docs are auto-generated by FastAPI at `/docs` once the backend is running.

## What's been tested, and how

I don't have Docker or internet access to image registries in the environment I built this in, so here's exactly what was and wasn't verified directly, rather than claiming more than I could check:

- **Backend logic:** installed a real PostgreSQL 16 instance and ran the FastAPI app against it directly (not SQLite, not mocks). Verified with `curl`: product/customer creation, duplicate SKU/email rejection (409), validation errors (422), order creation with correct stock deduction and total calculation, insufficient-stock rejection with no side effects, order cancellation restoring stock, delete-protection on referenced products/customers, and the dashboard summary numbers.
- **Frontend logic:** full component test suite (7 tests, Vitest + React Testing Library) covering the dashboard summary rendering, the product delete-confirmation flow, and the order form's running total, stock validation, and submit payload. The production build (`npm run build`) and lint (`npx eslint .`) both run clean. I also served the production build and hit it from a browser-equivalent client to confirm it loads and calls the API correctly.
- **Docker images:** the Dockerfiles and `docker-compose.yml` are written carefully and reviewed line by line, but I could **not** run `docker build` or `docker compose up` myself — my sandbox's network is restricted to package registries (npm/pip/apt) and doesn't reach Docker Hub. You should run `docker compose up --build` yourself as the first real test of the container setup; if anything's off, it's most likely a base-image version mismatch, which is a one-line fix.
- **Live deployment:** not done by me, for the same reason plus one more — deploying to Render/Vercel/Docker Hub needs *your* accounts. Step-by-step instructions are below.

## Deployment

### 1. Push to GitHub

```bash
cd inventory-system
git add .
git commit -m "Inventory and order management system"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

### 2. Backend → Render (or Railway / Fly.io)

On Render: **New → Web Service → connect your repo**, then:
- Root directory: `backend`
- Environment: Docker (it'll pick up `backend/Dockerfile` automatically)
- Add a **PostgreSQL** instance from Render's dashboard (or use Railway's/your own), and set the backend's `DATABASE_URL` env var to the connection string it gives you
- Set `FRONTEND_ORIGIN` once you know your frontend's URL (step 3)
- Deploy — note the public URL Render gives you, e.g. `https://your-backend.onrender.com`

### 3. Frontend → Vercel (or Netlify)

On Vercel: **New Project → import your repo**, then:
- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`, output directory: `dist`
- Vercel doesn't run your Dockerfile for static frontends, so set the build-time env var instead: `VITE_API_URL = https://your-backend.onrender.com`
- Deploy — note the public URL, e.g. `https://your-frontend.vercel.app`

Then go back to Render and set the backend's `FRONTEND_ORIGIN` to that exact Vercel URL, and redeploy the backend so CORS allows it.

*(If you deploy the frontend as a Docker container instead — e.g. on Fly.io — set the `API_URL` **runtime** env var on that container to the backend's URL, per the table above, rather than `VITE_API_URL`.)*

### 4. Docker Hub image (backend)

```bash
cd backend
docker build -t <your-dockerhub-username>/inventory-backend:latest .
docker login
docker push <your-dockerhub-username>/inventory-backend:latest
```

### 5. Submission checklist

- [ ] GitHub repo link (frontend + backend code)
- [ ] Docker Hub image link (backend)
- [ ] Live frontend URL (Vercel/Netlify)
- [ ] Live backend URL (Render/Railway/Fly.io) — check `/health` and `/docs` both load

## Known limitations / what I'd improve with more time

- Table creation uses `Base.metadata.create_all()` on startup rather than Alembic migrations — fine for this assessment's scale, not how I'd do it for a real production rollout with evolving schemas.
- No authentication — anyone with the URL can use the API. Out of scope per the assessment brief, but the obvious next step.
- The order form lets you add one product line at a time; bulk-adding from a search/autocomplete would scale better for a catalog larger than a handful of items.
