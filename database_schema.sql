-- ClinicFlow OPD Management Database Schema
-- PostgreSQL Database Setup Script
-- Version 1.21

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Patient Master Table
-- Stores unique patient information (can lookup by mobile)
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    city VARCHAR(255),
    mobile VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table
-- Each clinic visit is a separate record
CREATE TABLE visits (
    id VARCHAR(50) PRIMARY KEY,
    queue_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(255),
    mobile VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    in_time TIMESTAMP,
    out_time TIMESTAMP,
    notes TEXT,
    medicines TEXT,
    has_unread_alert BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    patient_id INTEGER REFERENCES patient(id)
);

-- Messages Table
-- Chat messages between operator and doctor
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Events Table
-- Calendar events for doctors and operators
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

-- Create indexes for better performance
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_patient_mobile ON patient(mobile);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_messages_patient_id ON messages(patient_id);

-- Sample Data (Optional - uncomment if needed)
/*
INSERT INTO patient (name, age, gender, city, mobile) VALUES
('John Doe', 35, 'MALE', 'Mumbai', '9876543210'),
('Jane Smith', 28, 'FEMALE', 'Delhi', '9876543211'),
('Raj Kumar', 45, 'MALE', 'Bangalore', '9876543212');

INSERT INTO events (title, event_date, event_time, description, event_type, remind_me, created_by) VALUES
('Team Meeting', CURRENT_DATE, '10:00:00', 'Weekly team sync', 'NORMAL', true, 'DOCTOR'),
('Hospital Visit', CURRENT_DATE + INTERVAL '1 day', '14:00:00', 'Visit to City Hospital', 'HOSPITAL RELATED', false, 'DOCTOR');
*/
