# Baristas - Deployment & Git Guide

## Quick Reference

| Service | Port | Container |
|---------|------|-----------|
| Nginx (public) | 80/443 | restaurant_nginx |
| Django API | 8000 | restaurant_web |
| Daphne (WebSocket) | 8001 | restaurant_daphne |
| Next.js Frontend | 3000 | restaurant_frontend |
| PostgreSQL | 5432 | restaurant_db |
| Redis | 6379 | restaurant_redis |
| Celery Worker | - | restaurant_celery |
| Celery Beat | - | restaurant_celery_beat |

---

## 1. Push to Git

### First-time setup

```bash
cd /home/anas/ReataurentOrder

# Verify remote
git remote -v
# Should show: origin git@github.com:AnasChaairi/ReataurentOrder.git

# Stage all changes
git add -A

# Review what will be committed
git status

# Commit
git commit -m "Production-ready: security hardening, KDS, waiter dashboard, WebSocket, deployment infra"

# Push
git push origin master
```

### If you need to set up a new remote

```bash
# Create a new repo on GitHub, then:
git remote add origin git@github.com:YOUR_USERNAME/ReataurentOrder.git
git push -u origin master
```

### SSH key setup (if needed)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings > SSH and GPG Keys > New SSH key

# Test connection
ssh -T git@github.com
```

---

## 2. Server Setup (VPS)

### Requirements
- Ubuntu 22.04+ or Debian 12+
- Minimum: 2 vCPU, 4GB RAM, 40GB disk
- Recommended: 4 vCPU, 8GB RAM for production load

### Initial server configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git ufw

# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Add swap (if less than 4GB RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
docker compose version
```

---

## 3. Deploy the Application

### Clone and configure

```bash
# Clone the repository
git clone git@github.com:AnasChaairi/ReataurentOrder.git
cd ReataurentOrder

# Create production environment file
cp .env.example .env
```

### Edit `.env` with production values

```bash
nano .env
```

**Required changes:**

```env
# Generate these - DO NOT use defaults
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
FIELD_ENCRYPTION_KEY=<run: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">

# Production settings
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database - use a strong password
DB_NAME=restaurant_order_db
DB_USER=restaurant_user
DB_PASSWORD=<generate-strong-password>
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# CORS - your actual domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Frontend URLs
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

### Update Nginx config

Edit `nginx/nginx.conf` and set your domain:

```bash
nano nginx/nginx.conf
```

Change `server_name _;` to `server_name yourdomain.com www.yourdomain.com;`

### Start the application

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View logs for a specific service
docker compose -f docker-compose.prod.yml logs -f web
```

### Create admin user

```bash
docker exec -it restaurant_web python manage.py createsuperuser
```

---

## 4. SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install -y certbot
```

### Get certificate (stop Nginx first)

```bash
# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Restart nginx
docker compose -f docker-compose.prod.yml start nginx
```

### Update docker-compose.prod.yml

Uncomment the SSL volume mounts in the nginx service:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - static_volume:/app/staticfiles:ro
    - media_volume:/app/media:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro        # Uncomment this
```

### Update nginx/nginx.conf

Uncomment the HTTPS redirect in the HTTP block and the full HTTPS server block at the bottom of the file. Update `your-domain.com` with your actual domain.

### Auto-renew certificate

```bash
# Add to crontab
sudo crontab -e

# Add this line (renews at 3 AM daily, restarts nginx after):
0 3 * * * certbot renew --quiet && docker restart restaurant_nginx
```

---

## 5. Database Backups

### Manual backup

```bash
# Run backup script
chmod +x scripts/backup.sh
./scripts/backup.sh
```

### Automated daily backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM, keep 30 days
0 2 * * * /path/to/ReataurentOrder/scripts/backup.sh >> /var/log/db-backup.log 2>&1
```

### Restore from backup

```bash
gunzip < /backups/restaurant_db_20260209_020000.sql.gz | \
  docker exec -i restaurant_db psql -U restaurant_user -d restaurant_order_db
```

---

## 6. Common Operations

### Update deployment (after pushing new code)

```bash
cd /path/to/ReataurentOrder
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

### Restart a single service

```bash
docker compose -f docker-compose.prod.yml restart web
docker compose -f docker-compose.prod.yml restart frontend
```

### View real-time logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Specific service
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f daphne
```

### Run Django management commands

```bash
docker exec -it restaurant_web python manage.py migrate
docker exec -it restaurant_web python manage.py collectstatic --noinput
docker exec -it restaurant_web python manage.py shell
```

### Check health

```bash
# Basic health check
curl http://localhost/api/health/

# Readiness check (DB + Redis + Celery)
curl http://localhost/api/health/ready/
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (CAUTION: deletes database data)
docker compose -f docker-compose.prod.yml down -v
```

---

## 7. Tablet Setup

Each tablet accesses the system via its table URL:

```
https://yourdomain.com/tablet/{tableId}
```

### Android Kiosk Mode (recommended)

1. Open Chrome on the tablet
2. Go to `https://yourdomain.com/tablet/1` (replace 1 with table number)
3. Tap the three dots menu > "Add to Home screen"
4. Use a kiosk lockdown app (e.g., "Fully Kiosk Browser") to lock the tablet to this URL

### iPad Kiosk Mode

1. Open Safari > go to the tablet URL
2. Tap Share > "Add to Home Screen"
3. Go to Settings > Accessibility > Guided Access > Enable
4. Open the app, triple-click the side button to start Guided Access

---

## 8. DNS Setup

Point your domain to the VPS IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 300 |
| A | www | YOUR_VPS_IP | 300 |

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | `docker compose logs <service>` to check errors |
| 502 Bad Gateway | Backend not ready yet, wait or check `docker logs restaurant_web` |
| WebSocket not connecting | Check Daphne logs: `docker logs restaurant_daphne` |
| Database connection refused | Check DB is healthy: `docker exec restaurant_db pg_isready` |
| Static files not loading | Run `docker exec restaurant_web python manage.py collectstatic --noinput` |
| Redis connection error | Check: `docker exec restaurant_redis redis-cli ping` |
| Permission denied | Check file ownership: `sudo chown -R $USER:$USER .` |
| Out of disk space | Clean Docker: `docker system prune -a` |
