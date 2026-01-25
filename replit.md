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
- `types.ts` - TypeScript type definitions
- `constants.tsx` - Application constants and icons
- `server.js` - Optional Express backend with MySQL (not required for basic operation)
- `database.sql` - MySQL schema (for optional backend)

## Technology Stack
- React 19 with TypeScript
- Vite for development and build
- Tailwind CSS (via CDN)
- localStorage for data persistence (works without backend)
- Optional: Node.js/Express backend with MySQL

## Running the Application
The frontend runs on port 5000 using Vite dev server.

## Features
- Operator View: Patient/visitor registration
- Doctor View: Consultation management
- Queue Management: Waiting, OPD, and Completed columns
- Real-time chat between operator and doctor
- Offline-first design with localStorage fallback

## Recent Changes
- 2026-01-25: Initial Replit setup
  - Configured Vite for port 5000 with allowedHosts: true
  - Added Vite entry point script to index.html
  - Removed import map (using Vite bundling instead)
