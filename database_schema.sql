-- Clinic-Q OPD Management Database Schema
-- PostgreSQL Database Setup Script
-- Version 1.47
-- Last Updated: February 7, 2026

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS plan_inquiries CASCADE;

-- =============================================
-- PATIENT MASTER TABLE
-- =============================================
-- Stores unique patient information (can lookup by mobile)
-- Same mobile can have multiple patients (family members)
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    city VARCHAR(255),
    mobile VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VISITS TABLE
-- =============================================
-- Each clinic visit is a separate record
-- Links to patient master via patient_id for returning patients
CREATE TABLE visits (
    id VARCHAR(50) PRIMARY KEY,
    queue_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    mobile VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP NOT NULL,
    in_time TIMESTAMP,
    out_time TIMESTAMP,
    notes TEXT,
    medicines TEXT,
    has_unread_alert BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    patient_id INTEGER REFERENCES patient(id)
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
-- Chat messages between operator and doctor for each patient
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL
);

-- =============================================
-- EVENTS TABLE
-- =============================================
-- Calendar events for doctors and operators
-- Event types: NORMAL, OPERATION, VISIT, HOSPITAL RELATED, SOCIAL
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'NORMAL',
    remind_me BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PLAN INQUIRIES TABLE
-- =============================================
-- Stores pricing plan inquiry submissions from the marketing website
CREATE TABLE plan_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    address TEXT,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    days INTEGER DEFAULT 0,
    amount INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_mobile ON visits(mobile);
CREATE INDEX idx_patient_mobile ON patient(mobile);
CREATE INDEX idx_patient_name ON patient(name);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_messages_patient_id ON messages(patient_id);
CREATE INDEX idx_plan_inquiries_email ON plan_inquiries(email);
CREATE INDEX idx_plan_inquiries_mobile ON plan_inquiries(mobile);

-- =============================================
-- TABLE REFERENCE
-- =============================================
-- 
-- patient: Master patient records
--   - id: Auto-increment primary key
--   - Used for patient lookup by mobile number
--   - Returning patients reuse existing records
--
-- visits: Each clinic visit
--   - id: UUID string
--   - queue_id: Daily queue number (resets each day)
--   - status: WAITING | OPD | COMPLETED
--   - category: PATIENT | VISITOR
--   - type: GEN PATIENT | REF PATIENT | REL PATIENT | FAMILY | RELATIVE | MR
--   - sort_order: Controls queue ordering for WAITING patients
--   - patient_id: Links to patient master table
--
-- messages: Real-time chat
--   - sender: OPERATOR | DOCTOR
--   - patient_id: Links to visits.id (CASCADE delete)
--
-- events: Calendar
--   - event_type: NORMAL | OPERATION | VISIT | HOSPITAL RELATED | SOCIAL
--   - remind_me: Shows notification dot on calendar menu
--   - created_by: OPERATOR | DOCTOR
--
-- plan_inquiries: Marketing website plan inquiries
--   - plan_type: FREE TRIAL | STARTER PLAN | PROFESSIONAL PLAN | PAID SUPPORT PLAN
--   - days: Plan duration in days
--   - amount: Plan cost amount

-- =============================================
-- END OF SCHEMA
-- =============================================
