# Clinic-Q OPD Management

## Overview
Clinic-Q is a React-based outpatient department (OPD) management application designed to streamline clinic operations. It provides a queue management system with distinct interfaces for operators (patient registration) and doctors (consultation management). The project aims to enhance efficiency in outpatient departments through real-time communication, patient tracking, and reporting, with a strong focus on a user-friendly experience for clinic staff.

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
- 2026-02-06: API Authentication & Security
  - Token-based session authentication added to backend
  - Login returns a session token; all sensitive API endpoints require Bearer token
  - In-memory session store with crypto.randomUUID token generation
  - requireAuth middleware protects: patients, visits, statistics, events, messages, calendar, reorder, move-to, call-operator, opd-status POST
  - Public endpoints (no auth): /api/metadata, /api/login, /api/logout, /api/plan-inquiry, /api/opd-status GET, /api/opd-status-options, /api/display/queue
  - New /api/display/queue endpoint: returns limited patient data (no medical notes/messages) for public Queue Display screen
  - Frontend stores token in localStorage, sends Authorization header with all authenticated requests
  - 401 responses automatically redirect to login screen and clear session
  - authFetch helper function used across App.tsx and all child components
- 2026-02-06: Pricing Page Redesigned with 2 Plans
  - FREE TRIAL PLAN: Full app for 30 days, GET STARTED FREE button opens form
  - PAID SUPPORT PLAN: Rs 25/day, recharge-based, interactive day calculator
  - Calculator: [Days] x Rs 25 = Total with +/- buttons and direct input
  - Both plans open form modal: Name, Hospital Name, Address, Mobile, Email, Plan details
  - Form submits to formsubmit.co (email to sandeep.bhagat1985@gmail.com) + backend API
  - Backend /api/plan-inquiry stores inquiries in plan_inquiries database table
  - Success/error states with visual feedback in modal
  - FAQ section updated for new plan structure
- 2026-02-04: Clinic-Q Marketing Website
  - Separate static marketing website at /site/ route
  - 4 pages: Home (index.html), About (about.html), Pricing (pricing.html), Contact (contact.html)
  - Home: Hero section, 8 feature cards, how-it-works flow, testimonials, CTA
  - About: Company story, stats, mission/vision, values, team section
  - Pricing: 2 plans (FREE TRIAL 30-day, PAID SUPPORT Rs 25/day)
  - Contact: Contact form, company info card, address, phone, email
  - Shared navbar and footer across all pages
  - Indigo/purple gradient theme matching Clinic-Q branding
  - Served via Express static at /site/ path, proxied through Vite in dev mode
- 2026-02-04: Version 1.46 - Icon + Text Navigation Menu
  - Menu items now show both icon and text label
  - Home icon + "Home", Report icon + "Report", Calendar icon + "Event"
  - Info icon + "Info", Monitor icon + "Display"
  - Icons sized at 16x16px with 13px text labels
  - Clean, compact design with proper spacing
- 2026-02-04: Version 1.44 - Enhanced Statistics Page
  - Added New vs Returning patients pie chart (purple/cyan)
  - Added Monthly Comparison section (this month vs last month with % change)
  - Busiest Day now shows specific date (e.g., "Tuesday on 04/Feb/2026")
  - Rearranged layout: 3 pie charts in one row (New vs Returning, Gender, Patient vs Visitor)
  - Top 3 Cities and Busiest Day moved to bottom row side by side
  - Summary cards now show monthly trend arrow
- 2026-02-04: Version 1.43 - Statistics/Info Page
  - New INFO menu item added after CALENDAR in navigation
  - Statistics page with comprehensive clinic analytics:
    - Summary cards: Today's count (with trend), Monthly count, Avg/Day, Weekly change %
    - 7-day patient trend bar chart
    - Gender ratio pie chart (Male/Female)
    - Patient vs Visitor pie chart
    - Top 3 cities with highest patient count
    - Busiest day of the week
  - Backend /api/statistics endpoint fetches all analytics data from database
- 2026-02-04: Version 1.42 - Custom Login Credentials System
  - Added secretcred.json file for configurable user credentials
  - Login now requires 3 fields: Mobile Number, Username, Password
  - Users are validated against secretcred.json (role determines DOCTOR/OPERATOR access)
  - Easy to customize - just edit secretcred.json to add/change users
  - Backend /api/login endpoint validates all 3 fields
- 2026-02-04: Version 1.41 - Dynamic App Name from Metadata
  - App name now loaded dynamically from metadata.json (appName field)
  - Header font size increased to text-3xl
  - Login screen, main header, footer, and Queue Display all use dynamic appName
  - metadata.json stores both hospitalName and appName for easy configuration
- 2026-02-04: Version 1.40 - App Renamed to Clinic-Q
  - Renamed from "ClinicFlow" to "Clinic-Q" throughout the application
  - Removed logo icon from header - text-only branding now
  - Updated page title, login screen, footer, and queue display
- 2026-02-04: Version 1.39 - New Queue Logo
  - Custom "Q+" logo with 3 decreasing dots (queue indicator)
  - Design: Q letter with + symbol inside, followed by 3 dots (large → medium → small)
  - Better represents the Queue management function of the app
- 2026-02-04: Version 1.38 - Patient Form Field Swap
  - Mobile Number field now appears first (left), Full Name second (right) in patient registration form
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