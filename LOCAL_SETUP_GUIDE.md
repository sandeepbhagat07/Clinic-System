# Clinic-Q - Local Setup Guide

This guide provides complete step-by-step instructions to run Clinic-Q on your local machine (Windows, Mac, or Linux).

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
9. [Application Features](#application-features)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Troubleshooting](#troubleshooting)

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
2. Extract the ZIP to a folder, e.g., `C:\Projects\Clinic-Q` (Windows) or `~/Projects/Clinic-Q` (Mac/Linux)

### Option B: Clone via Git

```bash
git clone <your-replit-git-url> Clinic-Q
cd Clinic-Q
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
CREATE USER clinicq WITH PASSWORD 'your_secure_password';
CREATE DATABASE clinicq_db OWNER clinicq;
GRANT ALL PRIVILEGES ON DATABASE clinicq_db TO clinicq;
\q
```

#### macOS / Linux

```bash
sudo -u postgres psql
```

Then run:

```sql
CREATE USER clinicq WITH PASSWORD 'your_secure_password';
CREATE DATABASE clinicq_db OWNER clinicq;
GRANT ALL PRIVILEGES ON DATABASE clinicq_db TO clinicq;
\q
```

### Step 2: Import the Database Schema

Navigate to your Clinic-Q project folder and run:

#### Windows

```cmd
psql -U clinicq -d clinicq_db -f database_schema.sql
```

#### macOS / Linux

```bash
psql -U clinicq -d clinicq_db -f database_schema.sql
```

Enter the password when prompted.

**Note:** 
- Use `database_schema.sql` for a fresh installation (creates empty tables)
- Use `database_backup.sql` if you want sample data included

---

## Database Structure

Clinic-Q uses 9 main tables:

| Table | Description |
|-------|-------------|
| **patient** | Master patient data (name, age, gender, city, mobile). Used for patient lookup. |
| **visits** | Each clinic visit record with queue info, status, notes, and medicines. |
| **messages** | Real-time chat messages between Operator and Doctor. |
| **events** | Calendar events with reminders for Doctor and Operator. |
| **plan_inquiries** | Pricing plan inquiry submissions from the marketing website. |
| **complaint_tags** | Auto-learning complaint suggestions used in doctor consultation form. |
| **diagnosis_tags** | Auto-learning diagnosis suggestions used in doctor consultation form. |
| **medicine_tags** | Auto-learning medicine name suggestions for prescriptions. |
| **app_sett** | Application license/subscription settings (start_date, end_date, recharge details). |

### Key Fields in visits table:

| Field | Description |
|-------|-------------|
| queue_id | Daily queue number (resets each day) |
| status | WAITING, OPD, or COMPLETED |
| category | PATIENT or VISITOR |
| type | GEN PATIENT, REF PATIENT, REL PATIENT, FAMILY, RELATIVE, MR |
| sort_order | Controls queue ordering |
| patient_id | Links to patient master table |

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
DATABASE_URL=postgresql://clinicq:your_secure_password@localhost:5432/clinicq_db
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
npx concurrently "node server.js" "npm run dev"
```

Or on Windows, you may need to run them in separate terminals:

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

### Login Credentials

Login requires 3 fields: **Mobile Number**, **Username**, and **Password**.

Credentials are configured in the `secretcred.json` file in the project root.

| Role | Mobile | Username | Password |
|------|--------|----------|----------|
| Doctor | 9033338800 | SANDEEP | 123 |
| Operator | 9033775500 | HETAL | 123 |

To add or modify users, edit the `secretcred.json` file:
```json
{
  "users": [
    {
      "username": "SANDEEP",
      "password": "123",
      "mobile": "9033338800",
      "role": "DOCTOR"
    },
    {
      "username": "HETAL",
      "password": "123",
      "mobile": "9033775500",
      "role": "OPERATOR"
    }
  ]
}
```

### Application URLs

| URL | Description |
|-----|-------------|
| http://localhost:5000 | Main application (login required) |
| http://localhost:5000/display | Queue Display Screen (no login, for waiting room TV) |
| http://localhost:5000/site/ | Marketing Website (Home, About, Pricing, Contact) |

---

## Application Features

### Version 1.50 Features

| Feature | Description |
|---------|-------------|
| **Queue Management** | Waiting, OPD, and Completed queues with real-time sync |
| **Patient Registration** | Register patients with mobile lookup for returning patients |
| **Doctor Consultation** | Add notes and medicines during consultation |
| **Real-time Chat** | Operator and Doctor can communicate about patients |
| **Statistics/Info Page** | View daily and overall clinic statistics |
| **Event Calendar** | Monthly/daily calendar with event types and reminders |
| **Patient History** | View complete visit history for any patient |
| **Patient Reports** | Search and export patient records with date filters and CSV export |
| **OPD Status Toggle** | Pause/resume OPD with configurable status messages |
| **Queue Display Screen** | Public TV display at /display URL for waiting room |
| **Login Persistence** | Token-based authentication with session persistence |
| **Resizable Dashboard** | Adjustable column widths on the dashboard |
| **Marketing Website** | Public website at /site/ with Home, About, Pricing, Contact pages |
| **Token-based Auth** | Secure authentication with bearer tokens |
| **Keyboard Shortcuts** | F2 for quick access, Ctrl+Enter for form submission |
| **Call Operator** | Doctor can send alert to Operator with sound notification |
| **Queue Reordering** | Up/Down buttons to reorder waiting queue |
| **Hospital Name Marquee** | Animated hospital name on display screen (configurable in metadata.json) |
| **Doctor Consultation Form** | Structured consultation with vitals, tag-based complaints/diagnosis, prescription table, advice, and follow-up date |
| **Print Prescription** | Generate printable A5-sized prescription from consultation data |
| **Data Reset** | Doctor can reset all patient/visit data from Report page (controlled via metadata.json) |
| **License Management** | Login page shows subscription expiry warning based on app_sett table |
| **Auto-complete Tags** | Complaints, diagnosis, and medicine names auto-suggest from usage history |

### Configuration Files

| File | Purpose |
|------|---------|
| `metadata.json` | Hospital name, app name, and configuration (see below) |
| `secretcred.json` | Login credentials (mobile, username, password, role) |
| `OPDSTATUS.txt` | OPD pause status messages (one per line) |
| `.env` | Database connection string |
| `vite.config.ts` | Frontend development server settings |

#### metadata.json Example
```json
{
  "name": "Clinic-Q OPD Management",
  "description": "OPD management system",
  "hospitalName": "Your Hospital Name Here",
  "appName": "Clinic-Q",
  "data_reset": "enable"
}
```
`data_reset` can be set to "enable" or "disable" to control visibility of the Reset Data button (Doctor role only).

---

## Keyboard Shortcuts

| Shortcut | Operator Role | Doctor Role |
|----------|--------------|-------------|
| **F2** | Focus mobile number input field | Open first OPD patient consultation |
| **Ctrl+Enter** | Submit current form | Submit current form |

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
psql -U clinicq -d clinicq_db -f database_schema.sql
```

### Issue: "FATAL: password authentication failed"

**Cause:** Wrong password in DATABASE_URL.

**Solution:**
1. Reset the database user password:
   ```sql
   ALTER USER clinicq WITH PASSWORD 'new_password';
   ```
2. Update `.env` with the new password

### Issue: "Cannot find module 'pg'"

**Cause:** PostgreSQL driver not installed.

**Solution:**
```bash
npm install pg
```

### Issue: Queue Display shows "No patients"

**Cause:** No patients registered for today.

**Solution:**
1. Login as Operator (Mobile: 9033775500, Username: HETAL, Password: 123)
2. Register a new patient
3. The display screen will update automatically via Socket.IO

### Issue: Login fails with correct credentials

**Cause:** Credentials in `secretcred.json` may not match what you're entering.

**Solution:**
1. Check `secretcred.json` for the exact mobile, username, and password
2. Username matching is case-insensitive
3. Mobile and password must match exactly

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

**Clinic-Q v1.50** | Last Updated: February 8, 2026
