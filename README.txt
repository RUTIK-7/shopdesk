# ShopDesk

Order console project (Flask backend + React/Vite frontend).

## Run
Backend: cd backend && pip install -r requirements.txt && python app.py (port 5001)
Frontend: cd frontend && npm install && npm run dev (port 3000) -> http://localhost:3000

## Connection
- frontend/vite.config.js proxies /api -> http://127.0.0.1:5001
- frontend/src/api.js base = /api
- backend/app.py uses backend/db.py (SQLite) and seeds via backend/seed.py

## Tests
cd backend && pytest tests
" filePath">
D:\t1\hackthon\shopdesk\README.txt