# LifeOS

LifeOS is a personal operating system app with a FastAPI backend and a Vite React frontend. The backend provides authentication, daily check-ins, habits, habit analytics, life areas, distractions, excuses, productivity, weekly summaries, and user settings. The frontend is the dashboard and tracking UI.

## Project Structure

```text
LifeOS/
  LifeOS/        FastAPI backend
  Frontend/      Vite React frontend
```

## Prerequisites

- Python 3.11+ recommended
- Node.js 20+ recommended
- PostgreSQL running locally or remotely

## Backend Setup

From the repository root:

```powershell
cd LifeOS
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `LifeOS\.env`:

```env
APP_NAME=LifeOS
APP_VERSION=1.0.0
DEBUG=True

DB_HOST=localhost
DB_PORT=5432
DB_NAME=LifeOS
DB_USER=postgres
DB_PASSWORD=postgres

SECRET_KEY=change-this-in-development
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=["http://localhost:5173"]
```

Create the PostgreSQL database if it does not exist:

Run the backend:

```powershell
python -m uvicorn main:app --reload
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Frontend Setup

From the repository root:

```powershell
cd Frontend
npm install
```

Run the frontend:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Running Both Apps

Use two terminals.

Terminal 1:

```powershell
cd LifeOS
.\.venv\Scripts\Activate.ps1
python main.py
```

Terminal 2:

```powershell
cd Frontend
npm run dev
```

Open:

```text
http://localhost:5173
```
