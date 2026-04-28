# technostrelka-project

## Что умеет проект

- Регистрация и авторизация пользователя по JWT.
- Обновление access-токена через refresh-токен.
- Получение текущего пользователя (`me`) по Bearer-токену.
- Профиль пользователя: никнейм + возрастная группа.
- Команды: создание и вступление по коду.
- Квесты: создание (draft), чекпоинты, обложка (upload), модерация, публикация/архив/скрытие.
- Прохождение квеста: соло/команда, строгий порядок чекпоинтов, очки и лидерборд.
- Жалобы: отправка пользователем + просмотр/resolve модератором.
- Web-клиент (React): лента, создание квеста, прохождение, модерация, карта.
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
- `GET  /api/v1/user/me` / `PATCH /api/v1/user/me`
- `GET  /api/v1/quests` / `GET /api/v1/quests/{id}`
- `POST /api/v1/quests` / `{id}/checkpoints` / `{id}/cover` / `{id}/submit` / `{id}/archive`
- `POST /api/v1/teams` / `POST /api/v1/teams/join` / `GET /api/v1/teams/my`
- `POST /api/v1/runs/start` / `GET /api/v1/runs/{id}` / `{id}/submit` / `{id}/abandon`
- `GET  /api/v1/leaderboard/teams`
- `POST /api/v1/complaints`
- `GET  /api/v1/moderation/quests` / approve / reject / hide
- `GET  /api/v1/moderation/complaints` / resolve
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

- 8 пользователей + 1 модератор (реалистичные профили)
- 4 команды (2–3 участника)
- 8 квестов по реальным локациям Нижнего Новгорода, в каждом минимум 3 чекпоинта
- 10–14 прохождений (started/in_progress/finished/abandoned)
- 2–3 жалобы (для демонстрации модерации)

Демо-аккаунты:

- модератор: `moderator / demo123`
- пользователи (пароль `demo123`):
  - `masha.nn@example.com`
  - `dima.nn@example.com`
  - `katya.nn@example.com`
  - `artem.nn@example.com`
  - `lena.nn@example.com`
  - `nikita.nn@example.com`
  - `sonya.nn@example.com`
  - `ivan.nn@example.com`

## Запуск для разработки (без Docker)

### Backend

Рекомендуемый способ — через Docker (там гарантированно совпадают версии и сеть между сервисами).
Если нужно запустить локально:

- Подними Postgres (и при необходимости Redis).
- Создай виртуальное окружение и установи зависимости из `backend/requirements.txt`.
- Передай переменные окружения как в `.env.example` (проще всего — создать `.env` в корне).

### Frontend

Локальный dev-сервер Vite:

```bash
make front-dev
```

По умолчанию frontend ходит на тот же домен, что и UI (через Nginx в Docker). Для чистого локального режима
убедись, что backend доступен и CORS настроен через `CORS_ORIGINS`.

## Важные переменные окружения

Файл примера: `.env.example`. Фактический файл: `.env` (в git не хранится).

- **SECRET_KEY**: обязательно поменять для продакшена (в `ENV=prod` запуск с `SECRET_KEY=change-me` упадет).
- **MEDIA_DIR**: папка для локальных загрузок (обложки и т.п.). Backend публикует это как `/uploads/*`.
- **VITE_YANDEX_SUGGEST_API_KEY**: ключ для подсказок города (если пустой — подсказки могут не работать).
- **CERT_HOST / CERT_SANS**: имя хоста и дополнительные SAN для self-signed сертификата в nginx.

## Что важно для демонстрации (жюри)

- **Единый вход**: открывать `https://localhost/` (UI) и `https://localhost/docs` (Swagger).
- **Модератор**: `moderator / demo123`, кнопка «Окно модератора» появляется после входа.
- **Seed**: `make seed` создаёт пользователей/команды/квесты/прохождения/жалобы.

## Как устроено хранение файлов

- Обложки/медиа сохраняются локально в `MEDIA_DIR` (по умолчанию `uploads` внутри backend контейнера).
- Доступ к ним идет через `GET /uploads/*` (nginx проксирует на backend).

## Готовность к демо и деплою (кратко)

Проект **готов к демонстрации как MVP**: поднятие одной командой, есть seed, модератор, основная логика квестов/проходок/рейтинга и карта в UI.

Для полноценного внешнего деплоя (публичный сервер) обычно стоит дополнить:

- **TLS**: заменить self-signed на нормальный сертификат (Let's Encrypt/Cloudflare).
- **Секреты**: задать надежный `SECRET_KEY`, ограничить/настроить `CORS_ORIGINS`.
- **Персистентность uploads**: вынести `MEDIA_DIR` в docker volume/host volume (чтобы не терялось при пересборке).
- **Ресурсы и мониторинг**: логи/метрики/healthchecks уже есть, но можно добавить лимиты ресурсов и алерты.
