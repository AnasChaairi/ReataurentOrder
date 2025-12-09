.PHONY: help build up down logs shell migrate makemigrations createsuperuser test clean

help:
	@echo "Restaurant Order Platform - Make Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make build          - Build Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View logs"
	@echo "  make shell          - Django shell"
	@echo "  make migrate        - Run database migrations"
	@echo "  make makemigrations - Create new migrations"
	@echo "  make createsuperuser - Create Django superuser"
	@echo "  make test           - Run tests"
	@echo "  make clean          - Clean up containers and volumes"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started. Access at:"
	@echo "  - API: http://localhost:8000"
	@echo "  - Admin: http://localhost:8000/admin"
	@echo "  - API Docs: http://localhost:8000/api/docs/"
	@echo "  - WebSocket: ws://localhost:8001"

down:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec web python manage.py shell

dbshell:
	docker-compose exec web python manage.py dbshell

migrate:
	docker-compose exec web python manage.py migrate

makemigrations:
	docker-compose exec web python manage.py makemigrations

createsuperuser:
	docker-compose exec web python manage.py createsuperuser

test:
	docker-compose exec web pytest

test-cov:
	docker-compose exec web pytest --cov=. --cov-report=html

lint:
	docker-compose exec web flake8 .

format:
	docker-compose exec web black .

clean:
	docker-compose down -v
	@echo "Cleaned up containers and volumes"

restart:
	docker-compose restart

# Development commands
dev-setup:
	cp backend/.env.example backend/.env
	@echo "Environment file created. Please update backend/.env with your configuration."
	docker-compose build
	docker-compose up -d
	docker-compose exec web python manage.py migrate
	@echo "Development environment ready!"

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down
