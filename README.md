# technostrelka-project

## Что умеет проект

- Регистрация и авторизация пользователя по JWT.
- Обновление access-токена через refresh-токен.
- Получение текущего пользователя (`me`) по Bearer-токену.
- Web-клиент (React) с auth flow: login/register, protected route, auto-refresh.
- Единая точка входа через Nginx (HTTPS) и проксирование `/api/*` на backend.

## Структура репозитория

```text
backend/
  app/                  FastAPI приложение
  alembic/              Миграции Alembic
  entrypoint.sh         Авто-миграции при старте контейнера
  Dockerfile
  requirements.txt
  requirements-dev.txt

frontend/
  src/                  React web-клиент
  index.html
  vite.config.ts
  package.json

infra/
  nginx/                Nginx + сборка frontend + self-signed TLS

docker-compose.yml
.env.example
```

## Технологии

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT (access/refresh)

### Web

- React
- TypeScript
- Vite

### Infra

- Docker / Docker Compose
- Nginx (HTTPS + reverse proxy)

## Архитектура

Приложение поднимается одним `docker compose` и работает через Nginx:

- Nginx отдает web-клиент (SPA) и проксирует backend под `/api/*`.
- Backend поднимает REST API.
- Postgres используется как основная БД.

## Реализованные модули (backend)

Префикс API: `/api/v1`

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET  /api/v1/user/me`
- `GET  /health`

## Требования

- Docker и Docker Compose (рекомендуемый способ запуска)

## Переменные окружения

Создай `.env` в корне проекта на основе `.env.example`:

```bash
cp .env.example .env
```

`.env` не хранится в git. В проекте используется один `.env` в корне.

Для HTTPS используется self-signed сертификат, который генерируется при старте `nginx`.
Если нужно открыть проект по другому хосту/IP, задай:

- `CERT_HOST` (например `localhost`, `myhost.local` или IP машины)
- `CERT_SANS` (опционально, дополнительные SAN, например `DNS:myhost.local,IP:192.168.1.10`)

## Запуск (Docker)

```bash
docker compose up --build -d
```

После запуска:

- Web (HTTPS): `https://localhost/`
- Swagger: `https://localhost/docs`
- Health: `https://localhost/health`
- Status page: `https://localhost/status`

Примечание: сертификат self-signed, браузер покажет предупреждение при первом открытии.

Остановка:

```bash
docker compose down
```

Полная очистка данных Postgres (удалит volume `pgdata`):

```bash
docker compose down -v
```

## Быстрые команды

В корне есть `Makefile`:

- `make up` / `make down`
- `make logs` / `make ps`
- `make reset-db`
- `make migrate`
- `make seed` (заполнить БД демо-данными)
- `make test-backend`
- `make front-typecheck`

## Seed (обязательные тестовые данные)

После первого запуска и миграций можно заполнить БД демо-данными одной командой:

```bash
make seed
```

Скрипт очищает БД и создаёт:

- 10 пользователей (9 обычных + 1 модератор)
- 3–5 команд (2–5 участников)
- 8–12 квестов в одном городе (Нижний Новгород), в каждом 3–7 чекпоинтов
- 10–20 прохождений (часть завершено, часть брошено)

Демо-аккаунты:

- модератор: `moderator / demo123`
- пользователи: `user1@example.com` … `user9@example.com` (пароль `demo123`)
