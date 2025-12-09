# Restaurant Order Platform - Backend

Django-based backend for the restaurant digital ordering platform with Odoo POS integration.

## Tech Stack

- **Framework:** Django 5.0 + Django REST Framework
- **Database:** PostgreSQL 16
- **Cache/Queue:** Redis
- **Task Queue:** Celery + Celery Beat
- **WebSocket:** Django Channels + Daphne
- **Integration:** Odoo POS via XML-RPC

## Project Structure

```
backend/
├── restaurant_order/      # Main project configuration
│   ├── settings.py       # Django settings
│   ├── urls.py           # URL routing
│   ├── wsgi.py          # WSGI application
│   ├── asgi.py          # ASGI application (WebSocket)
│   └── celery.py        # Celery configuration
├── accounts/             # User authentication & management
├── menu/                 # Menu & category management
├── orders/               # Order processing
├── tables/               # Table & waiter assignment
├── odoo_integration/     # Odoo POS sync
├── notifications/        # Real-time notifications
├── analytics/            # Reporting & analytics
├── logs/                 # Application logs
├── media/                # Uploaded files
└── staticfiles/          # Static files

```

## Setup Instructions

### Using Docker (Recommended)

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your configuration**

3. **Build and start services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - API: http://localhost:8000
   - Admin: http://localhost:8000/admin
   - API Docs: http://localhost:8000/api/docs/
   - WebSocket: ws://localhost:8001

5. **Default superuser credentials:**
   - Email: admin@restaurant.com
   - Password: admin123

### Manual Setup (Development)

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup PostgreSQL and Redis** (ensure both are running)

4. **Copy and configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server:**
   ```bash
   python manage.py runserver
   ```

8. **In separate terminals, start Celery:**
   ```bash
   # Worker
   celery -A restaurant_order worker -l info

   # Beat scheduler
   celery -A restaurant_order beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

## Common Commands

### Database

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database
python manage.py flush

# Database shell
python manage.py dbshell
```

### Development

```bash
# Run development server
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### Testing

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=.

# Run specific app tests
pytest accounts/tests.py

# Run with verbose output
pytest -v
```

### Celery

```bash
# Start worker
celery -A restaurant_order worker -l info

# Start beat scheduler
celery -A restaurant_order beat -l info

# Monitor tasks (Flower)
celery -A restaurant_order flower
```

### Docker

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Execute commands in container
docker-compose exec web python manage.py migrate

# Rebuild specific service
docker-compose build web
```

## API Documentation

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **OpenAPI Schema:** http://localhost:8000/api/schema/

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Database configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD` - Odoo integration
- `SENTRY_DSN` - Error tracking (production)

## Development Workflow

1. Create feature branch
2. Implement changes
3. Write tests
4. Run tests: `pytest`
5. Format code: `black .`
6. Lint code: `flake8`
7. Commit and push
8. Create pull request

## Deployment

See deployment documentation in `/docs/deployment.md` (to be created in Milestone 10)

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify `DB_HOST` is correct (localhost for local, db for Docker)

### Celery tasks not running
- Check Redis is running
- Verify `CELERY_BROKER_URL` in `.env`
- Ensure celery worker is started

### WebSocket connection fails
- Ensure Daphne is running (port 8001)
- Check `CHANNEL_LAYERS` configuration
- Verify Redis connection

## License

Proprietary - All rights reserved
