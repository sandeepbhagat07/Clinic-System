-- ClinicFlow OPD Management - PostgreSQL Schema
-- Version 1.10

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(255) PRIMARY KEY,
    queue_id INTEGER,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    city VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    notes TEXT,
    vitals TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    in_time TIMESTAMP,
    out_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_sort_order ON patients(sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_patient_id ON messages(patient_id);
