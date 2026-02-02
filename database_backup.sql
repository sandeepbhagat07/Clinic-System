-- ClinicFlow Database Backup
-- Generated: February 2, 2026
-- Version: 1.26

-- =============================================
-- DROP EXISTING TABLES (if running fresh)
-- =============================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Patient Master Table (stores unique patient information)
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    city VARCHAR(100),
    mobile VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table (each clinic visit record)
CREATE TABLE visits (
    id VARCHAR(36) PRIMARY KEY,
    patient_id INTEGER REFERENCES patient(id) ON DELETE SET NULL,
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
    sort_order INTEGER DEFAULT 0
);

-- Messages Table (chat messages for patient communication)
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Events Table (calendar events)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'NORMAL',
    remind_me BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX idx_patient_mobile ON patient(mobile);
CREATE INDEX idx_patient_name ON patient(name);

CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_queue_id ON visits(queue_id);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_mobile ON visits(mobile);

CREATE INDEX idx_messages_patient_id ON messages(patient_id);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);

-- =============================================
-- INSERT SAMPLE DATA - PATIENT MASTER
-- =============================================

INSERT INTO patient (id, name, age, gender, city, mobile, created_at) VALUES
(1, 'BHARAT PATEL', 25, 'Male', 'New York', '903333656652', '2026-01-26 09:59:46'),
(2, 'Chetan Rudani', 32, 'Male', 'Toronto', '9865326598', '2026-01-26 10:00:04'),
(3, 'MEET D PANDYA', 33, 'Male', 'Paris', '9876543210', '2026-02-01 12:00:00'),
(4, 'DIVYESH PANCHAL', 37, 'Male', 'Tokyo', '9988776655', '2026-02-01 12:05:00'),
(5, 'MANISHA DEV PATEL', 22, 'Female', 'Dubai', '8877665544', '2026-02-01 12:10:00'),
(6, 'PARTHI VARSANI', 36, 'Male', 'Sydney', '7766554433', '2026-02-01 12:15:00'),
(7, 'VAISHALI PATEL', 29, 'Female', 'Dhavda', '6655443322', '2026-02-01 12:20:00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('patient_id_seq', (SELECT MAX(id) FROM patient));

-- =============================================
-- INSERT SAMPLE DATA - VISITS
-- =============================================

INSERT INTO visits (id, patient_id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, out_time, notes, medicines, has_unread_alert, sort_order) VALUES
('visit-001', 3, 3, 'MEET D PANDYA', 33, 'Male', 'PATIENT', 'REL PATIENT', 'Paris', '9876543210', 'OPD', '2026-02-01 12:00:00', '2026-02-01 18:52:00', NULL, NULL, NULL, FALSE, 0),
('visit-002', 4, 4, 'DIVYESH PANCHAL', 37, 'Male', 'PATIENT', 'GEN PATIENT', 'Tokyo', '9988776655', 'WAITING', '2026-02-01 12:05:00', NULL, NULL, NULL, NULL, FALSE, 1),
('visit-003', 5, 5, 'MANISHA DEV PATEL', 22, 'Female', 'PATIENT', 'GEN PATIENT', 'Dubai', '8877665544', 'WAITING', '2026-02-01 12:10:00', NULL, NULL, NULL, NULL, FALSE, 2),
('visit-004', 6, 6, 'PARTHI VARSANI', 36, 'Male', 'PATIENT', 'GEN PATIENT', 'Sydney', '7766554433', 'WAITING', '2026-02-01 12:15:00', NULL, NULL, NULL, NULL, FALSE, 3),
('visit-005', 7, 2, 'VAISHALI PATEL', 29, 'Female', 'PATIENT', 'GEN PATIENT', 'Dhavda', '6655443322', 'WAITING', '2026-02-01 12:20:00', NULL, NULL, NULL, NULL, FALSE, 4);

-- =============================================
-- INSERT SAMPLE DATA - EVENTS
-- =============================================

INSERT INTO events (title, event_date, event_time, description, event_type, remind_me, created_by) VALUES
('Hospital Inspection', '2026-02-05', '10:00:00', 'Annual hospital inspection by health department', 'HOSPITAL RELATED', TRUE, 'DOCTOR'),
('Staff Meeting', '2026-02-10', '14:00:00', 'Monthly staff coordination meeting', 'NORMAL', TRUE, 'DOCTOR'),
('Medical Conference', '2026-02-15', '09:00:00', 'Medical conference at city convention center', 'VISIT', FALSE, 'DOCTOR');

-- =============================================
-- SAMPLE MESSAGES (optional)
-- =============================================

-- INSERT INTO messages (id, patient_id, text, sender, timestamp) VALUES
-- ('msg-001', 'visit-001', 'Please bring previous reports', 'DOCTOR', 1706810400000),
-- ('msg-002', 'visit-001', 'OK, will bring them', 'OPERATOR', 1706810460000);

-- =============================================
-- VERIFY DATA
-- =============================================

-- Uncomment to verify after import:
-- SELECT COUNT(*) AS patient_count FROM patient;
-- SELECT COUNT(*) AS visit_count FROM visits;
-- SELECT COUNT(*) AS event_count FROM events;
-- SELECT COUNT(*) AS message_count FROM messages;

-- =============================================
-- END OF BACKUP
-- =============================================
