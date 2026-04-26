.PHONY: up stop down logs ps reset-db rebuild migrate backend-shell test-backend front-dev front-typecheck

up:
	docker compose up --build -d

stop:
	docker compose stop

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

reset-db:
	docker compose down -v

rebuild:
	docker compose build --no-cache

migrate:
	docker compose exec backend alembic upgrade head

backend-shell:
	docker compose exec backend sh

test-backend:
	PYTHONPYCACHEPREFIX=/tmp pytest -q backend/tests

front-dev:
	cd frontend && npm install && npm run dev

front-typecheck:
	cd frontend && npm install && npm run typecheck

