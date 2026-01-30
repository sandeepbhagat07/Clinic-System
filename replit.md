# ClinicFlow OPD Management

## Overview
ClinicFlow is a React-based outpatient department (OPD) management application. It provides a queue management system for clinics with separate views for operators (registration) and doctors (consultation).

## Project Structure
- `App.tsx` - Main application component with state management
- `index.tsx` - React entry point
- `index.html` - HTML template
- `vite.config.ts` - Vite configuration (port 5000, all hosts allowed)
- `components/` - React components:
  - `QueueColumn.tsx` - Queue display component
  - `PatientCard.tsx` - Individual patient card
  - `PatientForm.tsx` - Patient registration form
  - `DoctorConsultationForm.tsx` - Doctor consultation form
  - `ChatModal.tsx` - Chat modal for patient communication
  - `PatientReport.tsx` - Patient report with search and date range filters
- `types.ts` - TypeScript type definitions
- `constants.tsx` - Application constants and icons
- `server.js` - Express backend with PostgreSQL (required for full functionality)
- `database.sql` - PostgreSQL schema (legacy reference)
- `database_backup.sql` - Complete database backup with schema and sample data
- `LOCAL_SETUP_GUIDE.md` - Step-by-step guide to run locally on Windows/Mac/Linux
- `.env.example` - Environment variable template for local setup

## Technology Stack
- React 19 with TypeScript
- Vite for development and build
- Tailwind CSS (via CDN)
- localStorage for data persistence (works without backend)
- Optional: Node.js/Express backend with PostgreSQL (using Replit PostgreSQL)

## Running the Application
The frontend runs on port 5000 using Vite dev server. The backend runs on port 3001.

## Features
- Operator View: Patient/visitor registration
- Doctor View: Consultation management
- Queue Management: Waiting, OPD, and Completed columns
- Real-time chat between operator and doctor
- Database-backed design with localStorage fallback

## Stable Milestones (For Rollback Reference)
- **2026-01-30: "Q ClinicFlow Complete Version"**
  - Fully working OPD management system before Patient Lookup feature
  - All features from Version 1.00 to 1.15 are complete and tested
  - Use this checkpoint to restore if new development causes issues
  - To restore: Tell the assistant "Restore to Q ClinicFlow Complete Version"

## Database Structure
- **patient** table: Master patient data (id, name, age, gender, city, mobile, created_at)
  - Stores unique patient information for lookup by mobile number
  - Same mobile can have multiple patients (family members)
- **visits** table: Each clinic visit record
  - Contains patient_id (links to patient table)
  - Stores queue_id, name, age, gender, category, type, city, mobile, status, timestamps, notes, medicines
  - Each visit is a separate record even for returning patients
- **messages** table: Chat messages for patient communication

## Recent Changes
- 2026-01-30: Version 1.18 - OPD Card Compact Layout
  - Reduced OPD large card padding from 2rem to 1rem
  - Reduced patient name font from 3rem to 2.5rem
  - Reduced avatar size from 7rem to 6rem
  - OPD queue cards show Age/Gender/City on one line
  - Waiting and Completed queue cards remain unchanged
- 2026-01-30: Version 1.17 - Mobile Number Lookup Feature
  - Added search button next to Mobile field in Patient Registration form
  - Enter mobile number (min 3 digits) and click search to find existing patients
  - Shows dropdown list of matching patients from patient master table
  - Click on a patient to auto-fill: Name, Age, Gender, City, Mobile
  - Category and Entry Type remain unchanged (operator can still modify)
  - API endpoint: GET /api/patients/lookup/:mobile
  - Click outside dropdown to close it
- 2026-01-30: Version 1.16 - Database Restructuring for Patient Lookup
  - Split single 'patients' table into two tables: 'patient' (master data) and 'visits' (each visit)
  - Added patient_id column to visits table linking to patient master record
  - New patient registration now creates entry in both patient and visits tables
  - Returning patients (same name + mobile) reuse existing patient record
  - All queue functionality preserved: Waiting, OPD, Completed
  - Preparation for mobile number lookup feature (auto-fill patient details)
- 2026-01-28: Version 1.15 - Call Operator Alert Sound
  - Added pleasant chime sound when Doctor calls Operator
  - Uses Web Audio API (no external sound files needed)
  - Plays 3-tone ascending chime pattern (C5-E5-G5) twice
  - AudioContext unlocked on login for cross-browser compatibility
- 2026-01-27: Added local setup documentation
  - LOCAL_SETUP_GUIDE.md - Complete instructions for Windows/Mac/Linux
  - database_backup.sql - Full database schema and sample data export
  - .env.example - Environment variable template
- 2026-01-27: Version 1.14 - Completed Queue Sorting Fix
  - Most recently completed patients now appear at TOP of Completed Queue
  - Sorting uses outTime DESC with createdAt as fallback
  - Backend automatically sets out_time when status becomes COMPLETED
  - Backend clears out_time when patient moves back to WAITING or OPD
- 2026-01-27: Version 1.13 - Patient Form Button Updates
  - Renamed "Complete Registration" button to "SAVE"
  - Added "CLEAR" button (gray) to reset all form fields to defaults
  - Two-button layout: CLEAR (1/3 width) + SAVE (2/3 width)
- 2026-01-27: Version 1.12 - Doctor Call Operator Feature
  - Handy "Call Operator" button in header (36x36px amber square with phone icon)
  - Positioned before Logout button, visible only for DOCTOR users
  - Click sends real-time alert to all Operator browsers via Socket.IO
  - 2-second cooldown prevents accidental double-press
  - Green success flash confirms alert was sent
  - Tooltip shows "Call Operator" (or "Calling..." during cooldown)
  - Operator sees full-screen popup notification with sound
  - Popup stays visible until Operator clicks "Acknowledge" button
  - API endpoint: POST /api/call-operator
  - Socket event: doctor:call-operator
- 2026-01-26: Version 1.11 - Global Search in Dashboard
  - Added search box in header (only visible on Dashboard, hidden on Patient Report)
  - Live instant filtering as you type - no page refresh needed
  - Searches across Name, Mobile, and City fields (case-insensitive)
  - Filters all queues simultaneously: Waiting, OPD, and Completed
  - Clear (X) button to reset search
  - Search is local to each user - doesn't affect other browsers
  - Added gender-specific avatar icons (blue for male, pink for female)
- 2026-01-26: Version 1.10 - Card ordering in Waiting Queue
  - Added sort_order column to patients table for ordering cards
  - FAMILY/RELATIVE patient types pinned at top (cannot be reordered)
  - Other patient types can be reordered using Up/Down arrow buttons
  - Up/Down arrows visible on all cards, but disabled (grayed) for FAMILY/RELATIVE
  - Moving patient from OPD back to Waiting places them at position #1 (top of reorderable section)
  - New patients get added at the bottom of the queue (max sort_order + 1)
  - Startup normalization ensures sequential sort_order values on server restart
  - API endpoints: /api/patients/:id/reorder (Up/Down), /api/patients/:id/status (with sort_order)
  - Socket event: patient:reorder syncs ordering across browsers in real-time
  - OPD and Completed queues sort by time DESC (latest at top)
- 2026-01-26: Version 1.09 - Added Socket.IO real-time synchronization
  - Patient queue changes sync instantly between OPERATOR and DOCTOR browsers
  - Messages sync in real-time with unread notification badges
  - Events: patient:add, patient:update, patient:delete, message:new
  - Message deduplication prevents duplicate display for sender
- 2026-01-26: Added navigation menu with Dashboard and Patient Report views
  - Menu visible in header for both OPERATOR and DOCTOR users
  - Dashboard shows role-specific panel (OPERATOR = Registration, DOCTOR = Consultation)
  - Patient Report page with search filters (Name, City, Mobile) and date range
  - API endpoint /api/patients/report returns last 150 records ordered by created_at DESC
  - Compact stats badge in header showing patient/visitor counts with green/orange bullets
  - CSV Export button exports filtered patient data with date-stamped filename
- 2026-01-26: Implemented daily-based patient management
  - Patients are now filtered by today's date - only current day's patients appear in queues
  - Queue numbers (#1, #2, etc.) reset daily - first patient each day gets #1
  - Server calculates queue ID atomically using database transaction to prevent duplicates
  - Added /api/next-queue-id endpoint for fetching next queue number
- 2026-01-26: Implemented proper timestamp handling
  - Database now uses PostgreSQL TIMESTAMP type for created_at, in_time, out_time
  - Server converts timestamps to ISO format with safe validation (toISOSafe helper)
  - PatientCard displays times in 12-hour format (e.g., "10:30 AM")
  - Handles both string and number timestamp formats
- 2026-01-25: Migrated from MySQL to Replit PostgreSQL
  - Updated server.js to use `pg` pool
  - Updated frontend to connect to port 3001 API
  - Updated UI labels and documentation
