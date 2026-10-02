# Stockroom frontend

React + Vite inventory interface. See ../SETUP.md for local API startup, database migration, authentication and deployment.

Accounts with `users.role = 'user'` can list, search, and view product details. Accounts with `users.role = 'admin'` also have create, edit, delete, and inventory analytics. Registration offers User and Admin and saves the selected role. Permissions are checked against the database on every API request.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Start MySQL in WAMP, then run `npm run dev:api` in a separate terminal from this directory. Open http://localhost:5173.

Development uses `VITE_API_URL=/api`; Vite proxies API requests to `API_PROXY_TARGET` (default `http://127.0.0.1:8000`). To use WAMP Apache instead, set `API_PROXY_TARGET=http://localhost/lab6_crud/public` and restart Vite. For a separately hosted production API, set `VITE_API_URL` to its full URL ending in `/api` and set the backend `FRONTEND_URL` to the frontend origin. Never put database credentials into frontend environment variables.

Use the Test API routes link to open https://api-tester.marasigan.dev/. See ../API-TESTING.md for routes and request examples.
