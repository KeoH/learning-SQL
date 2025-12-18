.PHONY: up down logs psql clean help test

DB_CONTAINER=learning-sql-db
DB_USER=admin
DB_NAME=learning_db

help:
	@echo "Available commands:"
	@echo "  make up      - Start the database container"
	@echo "  make down    - Stop and remove the database container"
	@echo "  make logs    - View database logs"
	@echo "  make psql    - Connect to the database using psql"
	@echo "  make clean   - Stop container and remove the volume (CAUTION: deletes data)"
	@echo "  make test    - Run local web tests"

test:
	cd web && npm run coverage

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

psql:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME)

clean:
	docker compose down -v
