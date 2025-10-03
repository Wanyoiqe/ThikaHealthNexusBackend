# API cURL examples

Base URL (local development):

```
http://localhost:5000
```

Notes:
- The default port used by the app is 5000 (from `config.json`). If you set a different `PORT` env var, replace the port in the examples.
- Some endpoints return a JWT token on success (registration/login). For protected endpoints include the header `Authorization: Bearer <token>`.
- The project uses JSON request/response bodies.

---

## Health check

Check the app health.

Request

```
curl -i http://localhost:5000/health
```

Success response (200)

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{ "status": "UP" }
```

---

## Register user

Create a new user (or reactivate soft-deleted user). Returns a user object with a token.

Request

```
curl -i -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "supersecret",
    "phone_number": "+254700000000"
  }'
```

Success response (201 or 200 when reactivated)

```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "result_code": 1,
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+254700000000",
    "token": "<JWT_TOKEN_HERE>",
    ...
  }
}
```

---

## Login user

Authenticate with email and password. Returns user object with token.

Request

```
curl -i -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "supersecret"
  }'
```

Success response (200)

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "result_code": 1,
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "email": "john.doe@example.com",
    "token": "<JWT_TOKEN_HERE>",
    ...
  }
}
```

Use the token in protected requests:

```
curl -i http://localhost:5000/protected-route \
  -H "Authorization: Bearer <JWT_TOKEN_HERE>"
```

Note: this project exposes an auth middleware in `middlewares/authMiddleware.js` if you add protected routes that require a token.

---

## DB utilities (development only)

These routes perform database maintenance tasks. Use them only in development and with caution.

1) Fix / sync DB models

```
curl -i http://localhost:5000/dbfix
```

2) Seed data (loads `data/data.json` into the DB)

```
curl -i http://localhost:5000/seed
```

3) Drop tables (dangerous — removes tables listed in controller)

```
curl -i http://localhost:5000/dbDrop
```

Each endpoint returns plain text confirming the action on success (200).

---

## Appointments

1) Book appointment (patient must be authenticated)

Request

```
curl -i -X POST http://localhost:5000/api/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN_HERE>" \
  -d '{ "date_time": "2025-10-10T10:00:00Z", "provider_id": "<PROVIDER_UUID>" }'
```

2) Get available doctors for a time window

Request

```
curl -i -X POST http://localhost:5000/api/appointments/available \
  -H "Content-Type: application/json" \
  -d '{ "from": "2025-10-10T09:00:00Z", "to": "2025-10-10T12:00:00Z" }'
```

3) Get upcoming appointments (authenticated)

```
curl -i -H "Authorization: Bearer <JWT_TOKEN_HERE>" http://localhost:5000/api/appointments/upcoming
```

4) Get past appointments (authenticated)

```
curl -i -H "Authorization: Bearer <JWT_TOKEN_HERE>" http://localhost:5000/api/appointments/past
```

---

## Error behavior

The app has a global error handler. Error responses typically include `result_code: 0` and a `message` field. Example:

```
HTTP/1.1 401 Unauthorized
{
  "result_code": 0,
  "message": "Invalid credentials."
}
```

---

If you want, I can also:
- add examples for other controllers/models if you add routes for them,
- generate Postman collection or a small README snippet to run the server locally.
