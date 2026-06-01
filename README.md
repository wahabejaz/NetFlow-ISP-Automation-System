# NetFlow ISP Portal

NetFlow is a full-stack ISP automation system with a Django backend and a React + TypeScript frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+
- MySQL 8+

## 1. Clone and install dependencies

```bash
cd "Final Project"
python -m pip install -r requirements.txt
npm install
```

## 2. Create the database

Create a MySQL database named `isp_automation_system`.

```sql
CREATE DATABASE isp_automation_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Configure environment variables

Copy the example file and fill in your local values.

```bash
copy .env.example .env
```

Required values:

- `DB_USER` and `DB_PASSWORD` for your MySQL user
- `DJANGO_SECRET_KEY` for Django
- `DJANGO_DEBUG=1` for local development
- `GEMINI_API_KEY` is optional, but required for the AI analyzer endpoint to work

## 4. Run database migrations

```bash
python manage.py migrate
```

## 5. Start the backend

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

## 6. Start the frontend

Open a second terminal and run:

```bash
npm run dev
```

The app will be available at `http://127.0.0.1:5173/`.

The Vite dev server is already configured to proxy `/api` requests to `http://127.0.0.1:8000`.

## Initial setup

If your database is empty, the backend can bootstrap a default administrator and ISP packages on first login or via the `/api/bootstrap/` endpoint. You should create your own admin and user accounts for production use.

## Troubleshooting

- If the backend fails to connect to MySQL, verify that `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `.env` match your local MySQL setup.
- If the AI analyzer endpoint is unavailable, confirm that `GEMINI_API_KEY` is set. If it is missing, the backend logs a warning and the AI endpoint will not function.
- If the frontend cannot reach the backend, ensure both servers are running and that `npm run dev` is using the configured proxy from `vite.config.ts`.
