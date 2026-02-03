# ClinicFlow OPD Management - Setup Guide

Complete step-by-step instructions to host ClinicFlow on your local machine or any server.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (Local Development)](#quick-start-local-development)
3. [Database Setup](#database-setup)
4. [Configuration Files](#configuration-files)
5. [Running the Application](#running-the-application)
6. [Production Deployment](#production-deployment)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 18.x or higher | https://nodejs.org/ |
| PostgreSQL | 14.x or higher | https://www.postgresql.org/download/ |
| npm | 9.x or higher | Comes with Node.js |
| Git | Latest | https://git-scm.com/ |

### Verify Installation
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show psql 14.x or higher
```

---

## Quick Start (Local Development)

### Step 1: Clone or Download the Project
```bash
# If using git
git clone <your-repository-url>
cd clinicflow-opd-management

# Or extract the downloaded ZIP file
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up PostgreSQL Database
See [Database Setup](#database-setup) section below.

### Step 4: Configure Environment Variables
Create a `.env` file in the project root:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/clinicflow
```
Note: The application uses `DATABASE_URL` as the primary connection string. This single variable contains all database connection details.

### Step 5: Run the Application
```bash
# Development mode (with hot reload)
npx concurrently "node server.js" "npm run dev"
```

### Step 6: Access the Application
Open your browser and go to: `http://localhost:5000`

**How it works in development:**
- Vite dev server runs on port 5000 (frontend with hot reload)
- Express backend runs on port 3001 (API server)
- Vite automatically proxies `/api` and `/socket.io` requests to the backend

---

## Database Setup

### Option A: Using psql Command Line

1. **Connect to PostgreSQL**
```bash
psql -U postgres
```

2. **Create Database**
```sql
CREATE DATABASE clinicflow;
\c clinicflow
```

3. **Run Schema Script**
```bash
psql -U postgres -d clinicflow -f database_schema.sql
```

### Option B: Using pgAdmin

1. Open pgAdmin and connect to your PostgreSQL server
2. Right-click on "Databases" and select "Create" > "Database"
3. Name it `clinicflow` and click "Save"
4. Right-click on the new database > "Query Tool"
5. Open `database_schema.sql` file and execute it

### Option C: Using Command in One Line
```bash
psql -U postgres -c "CREATE DATABASE clinicflow;" && psql -U postgres -d clinicflow -f database_schema.sql
```

### Verify Database Setup
```bash
psql -U postgres -d clinicflow -c "\dt"
```
You should see 4 tables: `patient`, `visits`, `messages`, `events`

---

## Configuration Files

### 1. metadata.json
Customize your clinic name and app settings:
```json
{
  "name": "ClinicFlow OPD Management",
  "description": "OPD management system",
  "hospitalName": "Your Hospital Name Here"
}
```

### 2. OPDSTATUS.txt
Add OPD pause reasons (one per line). Supports multiple languages:
```
OPD Starts from 09:30am
LUNCH BREAK. Doctor will Return at 02:30pm
DOCTOR is in Operation. Please Wait
DOCTOR is Currently Not Available
```

### 3. vite.config.ts
For local development, the default config works. For production behind a proxy, you may need to adjust the server settings.

---

## Running the Application

### Development Mode
Runs both backend (Express) and frontend (Vite) with hot reload:
```bash
npx concurrently "node server.js" "npm run dev"
```
- Frontend (Vite): http://localhost:5000 (use this URL)
- Backend API: http://localhost:3001 (internal, proxied automatically)

### Production Mode

1. **Build the frontend**
```bash
npm run build
```
This creates a `dist` folder with the compiled frontend.

2. **Start the production server**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/clinicflow node server.js
```
Access at: http://localhost:3001 (or set PORT env var to use a different port)

In production, the Express server serves both the API and the static frontend files.

---

## Production Deployment

### Option 1: VPS/Cloud Server (DigitalOcean, AWS, etc.)

1. **Set up the server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Configure PostgreSQL**
```bash
sudo -u postgres psql
CREATE USER clinicflow_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE clinicflow OWNER clinicflow_user;
\q
```

3. **Clone and setup project**
```bash
git clone <your-repo-url> /var/www/clinicflow
cd /var/www/clinicflow
npm install
npm run build
```

4. **Set environment variables**
```bash
export DATABASE_URL="postgresql://clinicflow_user:your_secure_password@localhost:5432/clinicflow"
export PORT=5000
```
Add these to `/etc/environment` or create a `.env` file for persistence.

5. **Run database schema**
```bash
psql $DATABASE_URL -f database_schema.sql
```

6. **Start with PM2**
```bash
PORT=5000 pm2 start server.js --name clinicflow
pm2 save
pm2 startup
```
Note: Set PORT=5000 if you want the app accessible on port 5000, otherwise it defaults to 3001.

### Option 2: Using Nginx as Reverse Proxy

1. **Install Nginx**
```bash
sudo apt install nginx
```

2. **Create Nginx config**
```bash
sudo nano /etc/nginx/sites-available/clinicflow
```

3. **Add configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;  # Match your PORT env var
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;  # Match your PORT env var
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

4. **Enable and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/clinicflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://clinicflow:password@db:5432/clinicflow
      - PORT=5000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=clinicflow
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=clinicflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_schema.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with Docker:
```bash
docker-compose up -d
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | Yes | Full PostgreSQL connection string | postgresql://user:pass@localhost:5432/clinicflow |
| PORT | No | Backend server port (default: 3001) | 3001 |

**Note:** The application uses only `DATABASE_URL` to connect to PostgreSQL. The connection string format is:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U your_user -d clinicflow -c "SELECT 1"
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Permission Denied Errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/clinicflow
```

### Frontend Not Loading
1. Ensure you ran `npm run build` for production
2. Check that `NODE_ENV=production` is set
3. Verify the `dist` folder exists

### Socket.IO Connection Issues
- Ensure WebSocket is enabled in your reverse proxy config
- Check firewall allows WebSocket connections
- Verify the correct Socket.IO path in Nginx config

### Common Error Messages

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | PostgreSQL not running or wrong connection details |
| `relation does not exist` | Run `database_schema.sql` to create tables |
| `permission denied` | Check database user permissions |
| `CORS error` | Frontend and backend on different ports - check proxy config |

---

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs: `pm2 logs clinicflow`
3. Check browser console for frontend errors

---

## File Structure

```
clinicflow/
├── server.js              # Backend Express server
├── App.tsx                # Main React component
├── components/            # React components
├── database_schema.sql    # PostgreSQL schema
├── metadata.json          # App configuration
├── OPDSTATUS.txt          # OPD pause reasons
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── dist/                  # Production build (after npm run build)
```

---

**Version:** 1.37  
**Last Updated:** February 3, 2026
