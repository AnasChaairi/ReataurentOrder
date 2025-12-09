# Restaurant Order Platform - Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- OR Python 3.11+, PostgreSQL 16, and Redis 7

## Quick Start with Docker (Recommended)

### 1. Clone and Navigate

```bash
cd /path/to/ReataurentOrder
```

### 2. Environment Setup

The `.env` file should already be configured. If not, copy from example:

```bash
cd backend
cp .env.example .env
```

### 3. Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Django web server (port 8000)
- Daphne WebSocket server (port 8001)
- Celery worker
- Celery beat scheduler

### 4. Run Migrations

```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

### 5. Create Superuser

```bash
docker-compose exec web python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### 6. Access the Application

- **API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation (Swagger)**: http://localhost:8000/api/docs/
- **API Documentation (ReDoc)**: http://localhost:8000/api/redoc/
- **WebSocket**: ws://localhost:8001

### 7. Test the API

#### Register a Customer Account

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "TestPass123",
    "password_confirm": "TestPass123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "role": "CUSTOMER"
  }'
```

#### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "TestPass123"
  }'
```

Save the `access` token from the response.

#### Get Profile

```bash
curl http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <your-access-token>"
```

## Manual Setup (Without Docker)

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup PostgreSQL

```bash
# Create database
createdb restaurant_order_db

# Update .env with your PostgreSQL credentials
```

### 4. Setup Redis

Ensure Redis is running on localhost:6379

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A restaurant_order worker -l info

# Terminal 3: Celery beat
celery -A restaurant_order beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Terminal 4: Daphne (WebSocket)
daphne -b 0.0.0.0 -p 8001 restaurant_order.asgi:application
```

## Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Restart a specific service
docker-compose restart web

# Execute command in container
docker-compose exec web python manage.py <command>

# Access Django shell
docker-compose exec web python manage.py shell

# Run tests
docker-compose exec web pytest

# Check service status
docker-compose ps
```

## Common Django Commands

```bash
# Create migrations
docker-compose exec web python manage.py makemigrations

# Apply migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Django shell
docker-compose exec web python manage.py shell

# Collect static files
docker-compose exec web python manage.py collectstatic

# Check for issues
docker-compose exec web python manage.py check
```

## Testing the Authentication System

### Using Swagger UI

1. Go to http://localhost:8000/api/docs/
2. Try the `/api/auth/register/` endpoint to create a customer
3. Try the `/api/auth/login/` endpoint to get tokens
4. Click "Authorize" button and enter: `Bearer <your-access-token>`
5. Now you can test authenticated endpoints

### Using cURL

#### 1. Register a Customer

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "first_name": "Test",
    "last_name": "User",
    "phone_number": "+1234567890",
    "role": "CUSTOMER"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

#### 3. Get Profile (Authenticated)

```bash
curl http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access-token>"
```

#### 4. Update Profile

```bash
curl -X PUT http://localhost:8000/api/auth/profile/update/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name"
  }'
```

#### 5. Change Password

```bash
curl -X POST http://localhost:8000/api/auth/change-password/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "SecurePass123",
    "new_password": "NewPass456",
    "new_password_confirm": "NewPass456"
  }'
```

#### 6. Admin: List Users

```bash
# Login as admin first
curl http://localhost:8000/api/auth/admin/users/ \
  -H "Authorization: Bearer <admin-access-token>"
```

#### 7. Admin: Create Waiter

```bash
curl -X POST http://localhost:8000/api/auth/admin/users/ \
  -H "Authorization: Bearer <admin-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waiter@restaurant.com",
    "password": "WaiterPass123",
    "first_name": "John",
    "last_name": "Waiter",
    "phone_number": "+1987654321",
    "role": "WAITER",
    "is_active": true
  }'
```

## Project Structure

```
ReataurentOrder/
├── backend/
│   ├── accounts/              # User authentication (✓ Milestone 2)
│   ├── menu/                  # Menu management (Milestone 3)
│   ├── orders/                # Order processing (Milestone 5)
│   ├── tables/                # Table management (Milestone 4)
│   ├── odoo_integration/      # Odoo sync (Milestone 6)
│   ├── notifications/         # Real-time notifications (Milestone 7)
│   ├── analytics/             # Reports & analytics (Milestone 8)
│   ├── restaurant_order/      # Main project settings
│   ├── logs/                  # Application logs
│   ├── media/                 # Uploaded files
│   └── staticfiles/           # Static files
├── docker-compose.yml
├── MILESTONE_1_COMPLETED.md   # Infrastructure setup ✓
├── MILESTONE_2_COMPLETED.md   # Authentication ✓
├── DEVELOPMENT_BACKLOG.md     # Full development plan
└── README.md
```

## Milestone Progress

- ✅ **Milestone 1**: Project Setup and Environment Configuration
- ✅ **Milestone 2**: Authentication and User Role Management
- ⏳ **Milestone 3**: Menu and Category Management
- ⏳ **Milestone 4**: Table and Waiter Assignment
- ⏳ **Milestone 5**: Order Management Workflow
- ⏳ **Milestone 6**: Odoo POS Integration
- ⏳ **Milestone 7**: Real-Time Notifications
- ⏳ **Milestone 8**: Analytics and Reporting
- ⏳ **Milestone 9**: Testing and Quality Assurance
- ⏳ **Milestone 10**: Deployment and Production Setup

## Default Credentials

After running the entrypoint script, a default admin user is created:

- **Email**: admin@restaurant.com
- **Password**: admin123

**IMPORTANT**: Change this password in production!

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
docker-compose down
# Edit docker-compose.yml to change ports
docker-compose up -d
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart db

# Check logs
docker-compose logs db
```

### Celery Not Processing Tasks

```bash
# Check Redis connection
docker-compose logs redis

# Restart Celery worker
docker-compose restart celery

# Check worker logs
docker-compose logs celery
```

### Migrations Conflict

```bash
# Reset migrations (WARNING: deletes data)
docker-compose exec web python manage.py migrate --fake accounts zero
docker-compose exec web python manage.py migrate accounts

# Or drop and recreate database
docker-compose down -v
docker-compose up -d
docker-compose exec web python manage.py migrate
```

## Next Steps

1. ✅ Complete Milestone 2 - Authentication system is ready!
2. ⏳ Implement Milestone 3 - Menu and Category Management
3. ⏳ Implement Milestone 4 - Table and Waiter Assignment
4. ⏳ Implement Milestone 5 - Order Management

## Getting Help

- Check API documentation: http://localhost:8000/api/docs/
- View logs: `docker-compose logs -f`
- Check Django admin: http://localhost:8000/admin/
- Review milestone documentation: `MILESTONE_*_COMPLETED.md`

## Development Workflow

1. Create feature branch
2. Make changes
3. Run migrations if needed
4. Test with Swagger UI
5. Commit and push
6. Create pull request

## API Testing Tools

- **Swagger UI**: http://localhost:8000/api/docs/ (Built-in)
- **Postman**: Import OpenAPI schema from http://localhost:8000/api/schema/
- **cURL**: Command-line testing
- **HTTPie**: `http POST localhost:8000/api/auth/login/ email=user@test.com password=pass123`
