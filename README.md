# RAG Chat Storage Microservice

Production-ready backend microservice for storing and managing chat histories from a RAG chatbot system.

## Features

- Chat session management (create, list, rename, favorite/unfavorite, delete)
- Message storage with optional retrieved context payload
- Pagination for sessions and messages
- Strict request validation with Zod (body, params, query)
- Strict environment validation on startup
- API key authentication (`x-api-key` header)
- API rate limiting
- Centralized request logging with Pino
- Global error handling
- Health checks (`/health/live`, `/health/ready`)
- Swagger/OpenAPI docs (`/docs`)
- Dockerized local setup with PostgreSQL + Adminer
- Basic unit tests

## Tech Stack

- Node.js 20
- Express.js
- PostgreSQL (`pg`)
- Docker / Docker Compose

## Project Structure

```txt
src/
  app.js
  index.js
  config/
  db/
  middlewares/
  routes/
  services/
  utils/
  scripts/
test/
```

## Environment Variables

Copy `.env.example` to `.env` and update values.

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API port | `3005` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/rag_chat` |
| `API_KEY` | Required API key for all `/api/*` routes | `my-secret-key` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP | `120` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed origin(s), comma-separated | `http://localhost:3005` |

## Run Locally with Docker

1. Create env file:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up --build
```

3. Access:

- API: `http://localhost:3005`
- Swagger UI: `http://localhost:3005/docs`
- PostgreSQL (host): `localhost:5433`
- Adminer: `http://localhost:8081`
  - System: `PostgreSQL`
  - Server: `db`
  - Username: `postgres`
  - Password: `postgres`
  - Database: `rag_chat`

## Run Without Docker

1. Install dependencies:

```bash
npm install
```

2. Set `.env` with a valid local PostgreSQL `DATABASE_URL`.

3. Run migrations:

```bash
npm run migrate
```

4. Start server:

```bash
npm run start
```

## API Authentication

Include API key header on all `/api/*` requests:

```http
x-api-key: <your_api_key>
```

Health endpoints are intentionally public:

- `GET /health/live`
- `GET /health/ready`

## Validation and Error Handling

- Request validation is enforced using Zod for:
  - body payloads
  - path params (UUID session ID)
  - query params (`userId`, `page`, `limit`)
- Unknown body/query fields are rejected by strict schemas.
- Invalid input returns `400` with structured validation details.
- Missing/invalid API key returns `401`.
- Not found resources return `404`.
- Unexpected server errors return `500` and are logged centrally.

## API Endpoints

Base path: `/api/v1`

### Sessions

- `POST /sessions` - create session
- `GET /sessions?userId=<id>&page=1&limit=20` - list user sessions
- `PATCH /sessions/:id/rename` - rename session
- `PATCH /sessions/:id/favorite` - mark/unmark favorite
- `DELETE /sessions/:id` - delete session and associated messages

### Messages

- `POST /sessions/:id/messages` - add message to session
- `GET /sessions/:id/messages?page=1&limit=20` - retrieve paginated message history

### Health

- `GET /health/live` - liveness
- `GET /health/ready` - readiness (checks DB connectivity)

## Example Requests

Create session:

```bash
curl -X POST http://localhost:3005/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{"userId":"user-123","title":"Support Chat"}'
```

Add message:

```bash
curl -X POST http://localhost:3005/api/v1/sessions/<SESSION_ID>/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{"sender":"assistant","content":"Hello!","retrievedContext":{"docs":["policy-1"]}}'
```

## Tests

Run unit tests:

```bash
npm test
```

## Notes

- Deleting a session cascades to its messages via foreign key `ON DELETE CASCADE`.
- Session `updatedAt` is refreshed when new messages are added or when session metadata changes.

## Case Study Checklist

### Core Functionalities

- Start and maintain chat sessions: Implemented
- Save messages with sender/content/optional context: Implemented
- Rename chat sessions: Implemented
- Mark/unmark sessions as favorite: Implemented
- Delete session and associated messages: Implemented
- Retrieve session message history: Implemented

### Technical Expectations

- Backend language/framework/database: Node.js + Express + PostgreSQL
- Environment-specific config with `.env`: Implemented
- API key authentication from env: Implemented
- Rate limiting: Implemented
- Centralized logging + global error handling: Implemented
- Dockerized local setup: Implemented

### Bonus

- Health check endpoints: Implemented
- Swagger/OpenAPI documentation: Implemented
- Database management tool in Docker (Adminer): Implemented
- Basic unit tests: Implemented
- CORS configuration: Implemented
- Pagination support: Implemented
