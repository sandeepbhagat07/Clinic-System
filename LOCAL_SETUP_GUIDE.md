# ClinicFlow - Local Setup Guide

This guide provides complete step-by-step instructions to run ClinicFlow on your local machine (Windows, Mac, or Linux).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Download the Code](#download-the-code)
3. [Install PostgreSQL](#install-postgresql)
4. [Setup the Database](#setup-the-database)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Install Dependencies](#install-dependencies)
7. [Run the Application](#run-the-application)
8. [Accessing the Application](#accessing-the-application)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

| Software | Minimum Version | Download Link |
|----------|-----------------|---------------|
| Node.js | v18.x or later | https://nodejs.org/ |
| PostgreSQL | v14.x or later | https://www.postgresql.org/download/ |
| Git (optional) | Any | https://git-scm.com/downloads |

### Verify Installation

Open a terminal/command prompt and run:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show psql (PostgreSQL) 14.x or higher
```

---

## Download the Code

### Option A: Download as ZIP (Easiest)

1. Download the ZIP file from Replit (Files panel → ⋮ menu → Download as ZIP)
2. Extract the ZIP to a folder, e.g., `C:\Projects\ClinicFlow` (Windows) or `~/Projects/ClinicFlow` (Mac/Linux)

### Option B: Clone via Git

```bash
git clone <your-replit-git-url> ClinicFlow
cd ClinicFlow
```

---

## Install PostgreSQL

### Windows

1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Keep the default port `5432`
   - Select "PostgreSQL Server" and "Command Line Tools"
4. After installation, add PostgreSQL to your PATH:
   - Add `C:\Program Files\PostgreSQL\<version>\bin` to your system PATH

### macOS

Using Homebrew (recommended):

```bash
brew install postgresql@14
brew services start postgresql@14
```

Or download from: https://www.postgresql.org/download/macosx/

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Setup the Database

### Step 1: Create a Database User and Database

#### Windows (using Command Prompt)

```cmd
psql -U postgres
```

Enter the password you set during installation, then run:

```sql
CREATE USER clinicflow WITH PASSWORD 'your_secure_password';
CREATE DATABASE clinicflow_db OWNER clinicflow;
GRANT ALL PRIVILEGES ON DATABASE clinicflow_db TO clinicflow;
\q
```

#### macOS / Linux

```bash
sudo -u postgres psql
```

Then run:

```sql
CREATE USER clinicflow WITH PASSWORD 'your_secure_password';
CREATE DATABASE clinicflow_db OWNER clinicflow;
GRANT ALL PRIVILEGES ON DATABASE clinicflow_db TO clinicflow;
\q
```

### Step 2: Import the Database Schema

Navigate to your ClinicFlow project folder and run:

#### Windows

```cmd
psql -U clinicflow -d clinicflow_db -f database_schema.sql
```

#### macOS / Linux

```bash
psql -U clinicflow -d clinicflow_db -f database_schema.sql
```

Enter the password when prompted.

**Note:** 
- Use `database_schema.sql` for a fresh installation (creates empty tables)
- Use `database_backup.sql` if you want to restore existing data from a previous backup

---

## Configure Environment Variables

### Step 1: Create .env File

Copy the example environment file:

#### Windows (Command Prompt)

```cmd
copy .env.example .env
```

#### macOS / Linux

```bash
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` in a text editor and update the values:

```env
DATABASE_URL=postgresql://clinicflow:your_secure_password@localhost:5432/clinicflow_db
```

Replace `your_secure_password` with the password you set in the database setup step.

**IMPORTANT:** The backend server requires a valid `DATABASE_URL` and PostgreSQL must be running before you start the application. Without this, the server will crash on startup.

---

## Install Dependencies

Navigate to your project folder and run:

```bash
npm install
```

This will install all required Node.js packages.

---

## Run the Application

You need to run two processes: the backend server and the frontend development server.

### Option A: Run Both Together (Recommended)

Open a terminal and run:

```bash
node server.js & npm run dev
```

On Windows, you may need to run them in separate terminals:

**Terminal 1 (Backend):**
```cmd
node server.js
```

**Terminal 2 (Frontend):**
```cmd
npm run dev
```

### Option B: Using Separate Terminals

**Terminal 1 - Start Backend Server:**
```bash
node server.js
```
You should see: `Server running on port 3001`

**Terminal 2 - Start Frontend Dev Server:**
```bash
npm run dev
```
You should see: `VITE ready` with Local: http://localhost:5000/

---

## Accessing the Application

Open your web browser and go to:

```
http://localhost:5000
```

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Operator | OPERATOR | op123 |
| Doctor | DOCTOR | doc123 |

---

## Troubleshooting

### Issue: Backend crashes immediately on startup

**Cause:** Missing DATABASE_URL or PostgreSQL not running.

**Solution:**
1. Ensure you have created the `.env` file with a valid `DATABASE_URL`
2. Verify PostgreSQL is running (see next issue)
3. The backend REQUIRES a database connection to start

### Issue: "ECONNREFUSED" or "Connection refused"

**Cause:** PostgreSQL is not running or connection details are wrong.

**Solution:**
1. Verify PostgreSQL is running:
   - Windows: Check Services app for "postgresql" service
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`
2. Verify your DATABASE_URL in `.env` is correct
3. Ensure the database and user exist

### Issue: "Port 3001/5000 already in use"

**Cause:** Another process is using the port.

**Solution:**

Windows:
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

Mac/Linux:
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Issue: "Module not found"

**Cause:** Dependencies not installed.

**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue: Database tables don't exist

**Cause:** Database schema was not imported.

**Solution:**
```bash
psql -U clinicflow -d clinicflow_db -f database_schema.sql
```

### Issue: "FATAL: password authentication failed"

**Cause:** Wrong password in DATABASE_URL.

**Solution:**
1. Reset the database user password:
   ```sql
   ALTER USER clinicflow WITH PASSWORD 'new_password';
   ```
2. Update `.env` with the new password

### Issue: "Cannot find module 'pg'"

**Cause:** PostgreSQL driver not installed.

**Solution:**
```bash
npm install pg
```

---

## Production Deployment Notes

For production deployment, consider:

1. **Use a production-grade database** (e.g., AWS RDS, DigitalOcean Managed PostgreSQL)
2. **Use environment variables** for sensitive data instead of .env files
3. **Build the frontend for production:**
   ```bash
   npm run build
   ```
4. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```
5. **Set up HTTPS** using a reverse proxy (Nginx, Caddy)
6. **Replace Tailwind CDN** with a proper PostCSS build

---

## Support

If you encounter issues not covered in this guide, check:
- Node.js documentation: https://nodejs.org/docs/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Vite documentation: https://vitejs.dev/guide/

---

**ClinicFlow v1.21** | Last Updated: January 2026
