# Stockroom — Laboratory Exercise 6

React frontend + LavaLust REST API. The frontend only talks to the API; MySQL credentials stay on the backend.

## Run locally

Requirements: PHP 8.4 with PDO MySQL, MySQL (WAMP is suitable), and a Node version supported by the installed Vite.

1. Configure the root `.env` using `.env.example`. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME. Create that MySQL database first. The existing local `.env` has been preserved and generated API signing keys have been added.
2. For a new installation, generate independent keys using `php -r "echo bin2hex(random_bytes(32));"` for APP_KEY, JWT_SECRET and REFRESH_TOKEN_KEY. Never commit `.env`.
3. From the project root:

```powershell
php lava migration run
php lava migration status
php lava serve
```

Alternatively, start the API explicitly on the frontend's default port:

```powershell
php -S localhost:8000 -t public public/index.php
```

4. Open another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

5. Open http://localhost:5173, create an account, then sign in. Add, edit, search and delete products. Logout invalidates the token immediately.

If the API runs on a different URL, set frontend/.env VITE_API_URL to its full API base URL (ending in `/api`) and restart Vite. WAMP's URL may be `http://localhost/lab6_crud/public/api`; use whichever URL successfully returns `/health`.

## Authentication and API

Passwords are stored as bcrypt hashes. Random bearer tokens expire after 24 hours and only their SHA-256 hashes are stored in refresh_tokens. This app uses opaque tokens, rather than the API library's optional JWT/refresh flow. Session data is held in browser sessionStorage. Every product endpoint checks the token and active user against the database. Registration and login are rate limited. Logout revokes the current session on the server.

LavaLust's API class provides responses, CORS, bearer-header extraction and rate limiting. API reference: https://lavalust.netlify.app/docs/libraries/api.html

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/health | Service health |
| POST | /api/auth/register | username, email, password |
| POST | /api/auth/login | username, password; returns access_token and user |
| GET | /api/auth/me | Current account; bearer token required |
| POST | /api/auth/logout | Revoke current bearer token |
| GET | /api/products | List products |
| GET | /api/products/{id} | Read product |
| POST | /api/products | Create product |
| PUT | /api/products/{id} | Replace product fields |
| PATCH | /api/products/{id} | Update selected fields |
| DELETE | /api/products/{id} | Delete product |

Product bodies: product_name, description (optional), price and quantity. All product routes require `Authorization: Bearer <access_token>`. Prices allow two decimal places; stock must be a non-negative integer. Errors use an `error` message and HTTP status. OPTIONS preflight routes are public.

## Migrations

The custom command lives in app/commands/Migration.php (this installed LavaLust version uses commands, plural). It supports run, status, create-migration NAME, rollback, rollback-all and refresh. Migration HTTP routes are intentionally registered only in CLI mode to prevent public database resets.

The migrations create users, refresh_tokens and products, plus the framework migration history table. Migration 004 adds fields missing in the older local users schema, preserves existing rows, switches users to InnoDB, adds unique account indexes and aligns price to DECIMAL(10,2). Its down operation keeps the compatibility fields to avoid losing account data. Existing duplicate usernames/emails must be resolved before unique indexes can be created. Decimal conversion rounds legacy prices to two decimal places.

Only use rollback-all and refresh against a disposable development database.

## Aiven MySQL and Render

Deployment files are ready; no live service or external repository has been created.

1. Create your Aiven MySQL service. Copy its host, port, username, database and password into Render environment variables. Download its project CA certificate.
2. Push the backend to your GitHub backend repository. Exclude `.env`, certificates, node_modules and frontend build output. The Docker ignore file excludes local credentials and the frontend from the API image.
3. Create a Render Docker web service from the repository. It uses Dockerfile and listens on PORT (default 10000). Set:
   - APP_ENV=production
   - APP_KEY, JWT_SECRET and REFRESH_TOKEN_KEY to independent random secrets (at least 32 characters)
   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME from Aiven
   - DB_SSL_CA_PEM to the complete multiline CA certificate text
   - RUN_MIGRATIONS=true for initial deployment
   - FRONTEND_URL to the exact frontend origin (no trailing slash), such as https://your-frontend.onrender.com
4. The entrypoint writes the CA to /tmp/aiven-ca.pem and the PDO connection verifies the certificate. Locally, you can instead set DB_SSL_CA to the absolute path of your downloaded CA.
5. Copy the contents of frontend/ to a separate React GitHub repository if your instructor requires two repositories. Create a Render Static Site with build command `npm ci && npm run build`, publish directory `dist`, and VITE_API_URL=https://your-api.onrender.com/api. In the combined repository use build command `cd frontend && npm ci && npm run build` and publish directory `frontend/dist`.
6. Update the backend FRONTEND_URL after the frontend URL is assigned. Redeploy the frontend whenever VITE_API_URL changes; Vite embeds it at build time.
7. After the first migration succeeds, set RUN_MIGRATIONS=false to avoid running schema checks on every startup. Verify `/api/health`, then create an account and exercise all product actions against Aiven.

render.yaml is an optional combined-repository Blueprint for the API and static frontend. Fill every sync:false value; frontend and backend URLs must be configured after Render assigns them. The two-repository manual setup above satisfies the submission requirement.

Official setup references: https://aiven.io/docs/products/mysql/howto/connect-with-php and https://render.com/docs/docker

## Verification and submission

Verified locally: migration execution/status, registration, invalid password rejection, login, profile, authenticated create/read/PUT/PATCH/delete, price/quantity validation, logout revocation, CORS OPTIONS, frontend build/lint and PHP syntax checks.

With the API running, `powershell -NoProfile -File tests/api-smoke.ps1` runs the API integration checks. It creates a uniquely named QA account and removes its test product. The QA account remains in the database. Do not run this against production. If repeated quickly, login/registration rate limits may require waiting one minute.

```powershell
npm run build --prefix frontend
npm run lint --prefix frontend
```

Browser rendering and deployment were not verified in this session. Capture the required screenshots after opening the app: login, product list, add form, edit form, delete confirmation, and Aiven database tables. Submit both GitHub repository URLs, Render API URL, frontend URL, screenshots and a working demonstration.
