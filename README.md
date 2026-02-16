# RAG Chat Storage Microservice (Java)

Production-ready backend microservice for storing and managing chat histories from a RAG chatbot system.

## Tech Stack

- Java 21
- Spring Boot 3
- PostgreSQL
- Flyway migrations
- Springdoc OpenAPI (Swagger UI)
- Bucket4j rate limiting
- Docker / Docker Compose

## Features

- Chat session management: create, list, rename, favorite/unfavorite, delete
- Message storage with sender, content, optional retrieved context
- OpenAI chat generation endpoint that stores both user and assistant messages
- API key authentication (`x-api-key`)
- Rate limiting (per-IP)
- Request ID propagation (`x-request-id`) for tracing
- Global error handling and validation
- Health checks: `/health/live`, `/health/ready`
- Swagger docs: `/docs`
- Pagination for sessions and messages

## Environment Variables

Copy `.env.example` to `.env` and fill values.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Service port | `3005` |
| `DATABASE_URL` | JDBC URL | `jdbc:postgresql://db:5432/rag_chat` |
| `DB_USERNAME` | DB user | `postgres` |
| `DB_PASSWORD` | DB password | `postgres` |
| `DB_POOL_MAX` | Max DB pool size | `20` |
| `DB_POOL_IDLE_TIMEOUT_MS` | Pool idle timeout | `30000` |
| `DB_POOL_CONNECTION_TIMEOUT_MS` | Pool connection timeout | `5000` |
| `API_KEY` | API key for `/api/*` endpoints | `my-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | OpenAI base URL | `https://api.openai.com/v1` |
| `OPENAI_TIMEOUT_MS` | OpenAI timeout | `20000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `120` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `CORS_ORIGIN` | Allowed origin(s) | `http://localhost:3005` |

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

Access:

- API: `http://localhost:3005`
- Swagger UI: `http://localhost:3005/docs`
- Adminer: `http://localhost:8081`
- PostgreSQL host access: `localhost:5433`

## Run Locally (Without Docker)

1. Ensure PostgreSQL is running.
2. Set local values in `.env` (use `localhost` in `DATABASE_URL`).
3. Run:

```bash
mvn spring-boot:run
```

Build jar:

```bash
mvn clean package
java -jar target/rag-chat-storage-service-1.0.0.jar
```

## API Authentication

All `/api/*` endpoints require:

```http
x-api-key: <your_api_key>
```

Public endpoints:

- `GET /health/live`
- `GET /health/ready`
- `/docs`

## API Endpoints

Base path: `/api/v1`

### Sessions

- `POST /sessions`
- `GET /sessions?userId=<id>&page=1&limit=20`
- `PATCH /sessions/{id}/rename`
- `PATCH /sessions/{id}/favorite`
- `DELETE /sessions/{id}`

### Messages

- `POST /sessions/{id}/messages`
- `GET /sessions/{id}/messages?page=1&limit=20`
- `POST /sessions/{id}/messages/chat`

## Tests

```bash
mvn test
```

## Best Practice Coverage

- Scalability: stateless APIs, DB indexing, pagination, configurable DB pool
- Security: API key auth, CORS, rate limiting, security headers, strict validation
- Error handling: centralized exception handling + structured error payloads
- Configuration: environment-driven config via `.env` and typed properties
