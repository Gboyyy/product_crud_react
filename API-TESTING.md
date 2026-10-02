# API route testing

Open https://api-tester.marasigan.dev/ using the Test API routes link.

Base URL for WAMP: `http://localhost/lab6_crud/public/api`.
Paste this exact base URL into the tester and click Save. `/config/api` is a configuration file location, not an API URL. The tester's `/create`, `/login`, `/logout`, `/me`, and `/profile` authentication paths are supported as aliases. Its user management and JWT tools are separate from this application's product CRUD and opaque bearer-token authentication.
Use `Content-Type: application/json` for JSON bodies.
After login copy `access_token` and set `Authorization: Bearer YOUR_TOKEN`.
The tester origin is allowed by CORS. If the hosted tester cannot reach localhost or the browser blocks HTTP requests, use a deployed HTTPS API or run `powershell -File tests/api-smoke.ps1` locally.

| Method | Path | Access |
| --- | --- | --- |
| GET | /health | Public |
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /auth/me | User or Admin |
| POST | /auth/logout | User or Admin |
| GET | /products | User or Admin |
| GET | /products/{id} | User or Admin |
| POST | /products | Admin |
| PUT | /products/{id} | Admin |
| PATCH | /products/{id} | Admin |
| DELETE | /products/{id} | Admin |
| OPTIONS | Any API route | Public |

Registration:
```json
{"username":"tester_admin","email":"tester_admin@example.com","password":"ExamplePass123!","role":"admin"}
```
Use `role: "user"` for view-only access; omitted role defaults to User. Other roles return 422.

Login:
```json
{"username":"tester_admin","password":"ExamplePass123!"}
```
Product POST and PUT:
```json
{"product_name":"Test product","description":"Route testing","price":"125.50","quantity":7}
```
PATCH accepts changed fields only, for example `{"quantity":10}`.
Use the created product ID for detail, update, and delete routes.
User tokens must return 403 for product mutations. Admin tokens can perform CRUD.
After logout the old token must return 401.
Admin analytics are calculated in React from products; there is no separate analytics route.
