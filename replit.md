# ClinicFlow OPD Management

## Overview
ClinicFlow is a React-based outpatient department (OPD) management application designed to streamline clinic operations. It provides a queue management system with distinct interfaces for operators (patient registration) and doctors (consultation management). The project aims to enhance efficiency in outpatient departments through real-time communication, patient tracking, and reporting, with a strong focus on a user-friendly experience for clinic staff.

## User Preferences
- I want iterative development.
- I want to be asked before making major changes.

## System Architecture
ClinicFlow uses a modern web stack with React 19 and TypeScript for the frontend, bundled with Vite. The UI is styled using Tailwind CSS (via CDN) for a responsive and consistent design.

The application features separate views for operators and doctors, managing patient flow through "Waiting," "OPD," and "Completed" queues. Real-time communication and queue synchronization between users are achieved using Socket.IO.

Key features include:
- Patient registration and lookup by mobile number.
- Doctor consultation management with notes and medicine details.
- Dynamic queue reordering for waiting patients (excluding specific categories).
- A public-facing Queue Display screen (`/display`) for waiting rooms, showing current OPD patients and the next in queue with real-time updates.
- OPD status toggle (Pause/Resume) with configurable reasons, instantly reflected across all interfaces and the display screen.
- An Event Calendar system with monthly and daily views, allowing event creation, editing, and deletion, with color-coded event types and real-time synchronization.
- Patient Report generation with search filters, date range selection, patient history lookup, and CSV export.
- Notifications, including a "Call Operator" feature for doctors to alert operators and a calendar notification for today's events.
- UI/UX elements include gender-specific avatars, animated elements (e.g., calendar notification ping, hospital name marquee on display screen), and optimized card layouts for different queues.
- Data persistence is handled via `localStorage` for standalone frontend use, with full functionality enabled by a Node.js/Express backend.
- The backend manages patient master data, visit records, messages, and events, ensuring atomic operations for queue ID generation and proper timestamp handling.

The system is designed for daily-based patient management, where queues reset daily and queue numbers are assigned sequentially per day.

## External Dependencies
- **React**: Frontend library.
- **TypeScript**: Superset of JavaScript for type-safety.
- **Vite**: Build tool.
- **Tailwind CSS**: Utility-first CSS framework.
- **localStorage**: Browser-based data persistence.
- **Node.js/Express**: Backend server (optional, for full functionality).
- **PostgreSQL**: Database for persistent storage (used with `pg` client library).
- **Socket.IO**: Real-time bidirectional event-based communication.

## Recent Changes
- 2026-02-03: Version 1.37 - Resizable Dashboard Columns + Setup Guide
  - Added SETUP_GUIDE.md with complete hosting instructions (local, VPS, Docker, Nginx)
  - Updated database_schema.sql to version 1.37
- 2026-02-03: Version 1.37 - Resizable Dashboard Columns
  - Added drag-to-resize dividers between the 3 dashboard columns (Waiting, OPD, Completed)
  - Column widths are saved to localStorage and persist across sessions
  - Visual feedback on hover (indigo color) and during drag
  - Minimum 15% / Maximum 60% limits prevent columns from becoming too small/large
  - "Reset" button appears in header when columns have been customized
- 2026-02-03: Version 1.36 - Login Persistence
  - Login state now persists across page refreshes using localStorage
  - Operator/Doctor stays logged in after browser refresh
  - Logout properly clears the saved session
- 2026-02-03: Version 1.35 - Radar Wave Animations on Display Screen
  - Added radar/wave animation effects to OPD status icons on Queue Display screen
  - Red Pause icon has red waves pulsing outward
  - Green Available icon has green waves pulsing outward
  - Creates eye-catching visual effect for waiting room display
- 2026-02-03: Version 1.34 - Hospital Name on Login Screen
  - Login screen now displays hospital name from metadata.json below "Clinic Q Flow"
  - Hospital name fetched dynamically from /api/metadata endpoint
- 2026-02-03: Version 1.33 - Fixed Patient History Icon Logic
  - History icon now only appears if patient has PREVIOUS visits (before today, not just patientId)
  - History modal excludes today's current visit, shows only past visits
  - Added `hasPreviousVisits` flag computed by backend for accurate icon visibility
  - Updated modal wording: "Previous Visits" instead of "Visit History"
- 2026-02-03: Version 1.32 - Patient History Icon in Consultation Form
  - Added History icon (document icon) before Chat button in OPD Consultation Form
  - Icon only visible if patient has previous visits (patientId exists)
  - Clicking icon opens Patient History modal showing all previous visits
  - OPDSTATUS.txt updated with Gujarati text support
- 2026-02-03: Version 1.31 - Dynamic OPD Status Options
  - OPDSTATUS.txt is now read fresh each time dropdown opens (no server restart needed)
  - Just edit the file and refresh the page to see new/updated pause reasons