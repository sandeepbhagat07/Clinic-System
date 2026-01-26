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
- `server.js` - Optional Express backend with MySQL (not required for basic operation)
- `database.sql` - MySQL schema (for optional backend)

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

## Recent Changes
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
