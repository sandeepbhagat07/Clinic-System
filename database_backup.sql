-- Clinic-Q Database Backup
-- Generated: February 7, 2026
-- Version: 1.47

-- =============================================
-- DROP EXISTING TABLES (if running fresh)
-- =============================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS plan_inquiries CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Patient Master Table (stores unique patient information)
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    city VARCHAR(255),
    mobile VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table (each clinic visit record)
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

-- Messages Table (chat messages for patient communication)
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
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
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan Inquiries Table (marketing website plan submissions)
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
-- CREATE INDEXES
-- =============================================

CREATE INDEX idx_patient_mobile ON patient(mobile);
CREATE INDEX idx_patient_name ON patient(name);

CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_mobile ON visits(mobile);

CREATE INDEX idx_messages_patient_id ON messages(patient_id);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_plan_inquiries_email ON plan_inquiries(email);
CREATE INDEX idx_plan_inquiries_mobile ON plan_inquiries(mobile);

-- =============================================
-- INSERT DATA - PATIENT MASTER (46 rows)
-- =============================================

INSERT INTO patient (id, name, age, gender, city, mobile, created_at) VALUES
(1, 'Anand Ratnani', 25, 'Male', 'New York', NULL, '2026-01-26 10:01:20.523'),
(2, 'Arunaben Limbani', 25, 'Female', 'New York', NULL, '2026-01-26 10:01:46.073'),
(3, 'BHARAT PATEL', 25, 'Male', 'New York', '903333656652', '2026-01-26 09:59:46.895'),
(4, 'Bajaj Jindal', 25, 'Male', 'New York', NULL, '2026-01-27 06:25:00.658'),
(5, 'Bhavin Thakkar', 25, 'Male', 'New York', '9845124578', '2026-01-27 03:15:56.155'),
(6, 'Binal Patel', 32, 'Female', 'New York', NULL, '2026-01-27 03:16:16.31'),
(7, 'Chetan Rudani', 32, 'Male', 'Toronto', '9865326598', '2026-01-26 10:00:04.865'),
(8, 'David Mayor', 25, 'Male', 'New York', '989898', '2026-01-27 05:13:39.232'),
(9, 'David Tendulkar', 25, 'Male', 'New York', '15515151', '2026-01-27 06:04:32.9'),
(10, 'Deena Vasani', 25, 'Female', 'New York', NULL, '2026-01-26 10:03:19.061'),
(11, 'Denish Patel', 25, 'Male', 'New York', '9865321245', '2026-01-28 16:06:28.008'),
(12, 'Hetal Bhagat', 25, 'Male', 'New York', NULL, '2026-01-27 03:16:54.381'),
(13, 'Maya Ben Prajapati', 25, 'Female', 'Paris', NULL, '2026-01-27 06:42:49.154'),
(14, 'Mayur Patel', 43, 'Female', 'Tokyo', '444444', '2026-01-27 05:14:34.326'),
(15, 'Mayur Patel Bhimani', 25, 'Male', 'Sydney', NULL, '2026-01-28 17:28:54.861'),
(16, 'Pankaj Lawyer', 25, 'Male', 'New York', NULL, '2026-01-27 05:14:21.765'),
(17, 'Pankaj Singa', 25, 'Male', 'New York', NULL, '2026-01-26 10:01:32.053'),
(18, 'Praveen patekl', 25, 'Male', 'New York', NULL, '2026-01-27 06:25:10.777'),
(19, 'Pushpa bhau', 25, 'Male', 'New York', NULL, '2026-01-27 06:42:35.974'),
(20, 'Sandeep Patel', 25, 'Male', 'New York', '09033338800', '2026-01-27 06:25:32.569'),
(21, 'Suresh Nayani', 25, 'Male', 'New York', NULL, '2026-01-26 10:02:43.105'),
(22, 'TVISHAA PATEL', 25, 'Female', 'New York', NULL, '2026-01-26 10:00:57.107'),
(23, 'Vijay Manani', 25, 'Male', 'New York', '1245789865', '2026-01-27 03:16:08.306'),
(24, 'Vipul Sudhar', 25, 'Male', 'Sydney', '9865326598', '2026-01-26 10:00:19.143'),
(25, 'Vishal Jain M', 25, 'Male', 'New York', NULL, '2026-01-27 06:21:41.59'),
(26, 'VAIDIK SANDEEP BHAGAT', 25, 'Male', 'Berlin', '9098653265', '2026-01-30 08:01:52.319'),
(27, 'Mittal Shah', 22, 'Female', 'Toronto', '1234567890', '2026-01-30 08:11:02.539'),
(28, 'Vishah K Patel', 25, 'Male', 'Singapore', '1000010000', '2026-01-30 08:13:08.295'),
(29, 'Mittal Tendulkar', 25, 'Female', 'Paris', '15515151', '2026-01-30 10:19:33.223'),
(30, 'Vishal Manani', 30, 'Male', 'Toronto', '9427513371', '2026-01-30 11:35:36.975'),
(31, 'Vaishali Patel', 29, 'Female', 'Dhavda', '9033886600', '2026-02-01 18:52:07.512'),
(32, 'Meet D Pandya', 33, 'Male', 'Paris', '7359852000', '2026-02-01 18:52:44.799'),
(33, 'Divyesh Panchal', 37, 'Male', 'Tokyo', '1234567890', '2026-02-01 19:15:11.486'),
(34, 'Manisha Dev Patel', 22, 'Female', 'Dubai', '4564564560', '2026-02-01 19:19:05.717'),
(35, 'Jayesh Manani', 33, 'Male', 'New York', '9879879870', '2026-02-01 19:20:03.784'),
(36, 'Parthi Varsani', 36, 'Male', 'Sydney', NULL, '2026-02-01 19:20:41.21'),
(37, 'Mayur BHAGAT', 34, 'Male', 'Dhavda', '9427513366', '2026-02-02 07:25:59.884'),
(38, 'Denisha Jain', 33, 'Female', 'Dubai', '9090909090', '2026-02-03 04:23:59.694'),
(39, 'Mayank Patidar', 25, 'Male', 'Toronto', '9494949494', '2026-02-03 04:24:27.865'),
(40, 'Shruti Limbani', 41, 'Female', 'Paris', '9595959595', '2026-02-03 04:24:51.923'),
(41, 'Manilal Nayani', 25, 'Male', 'Berlin', '9494158578', '2026-02-03 06:23:09.807'),
(42, 'Vishal Kesharani', 25, 'Male', 'New York', '9639639630', '2026-02-03 09:43:00.249'),
(43, 'Test Patient', 30, 'Male', 'Ahmedabad', '9876543210', '2026-02-06 10:33:35'),
(44, '9066906600', 25, 'Female', 'Paris', 'Mitali Sing', '2026-02-06 10:35:54.697'),
(45, 'Piyush Varma', 30, 'Male', 'Tokyo', '9033334444', '2026-02-07 07:15:25.192'),
(46, 'Dinial K. Rupala', 36, 'Male', 'Dubai', '9494158745', '2026-02-07 07:15:49.446');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('patient_id_seq', (SELECT MAX(id) FROM patient));

-- =============================================
-- INSERT DATA - VISITS (sample/demo data)
-- =============================================
-- Note: This contains representative sample visits. Your production
-- database may contain additional visit records.

INSERT INTO visits (id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, out_time, notes, medicines, has_unread_alert, sort_order, patient_id) VALUES
('visit-20260201-001', 1, 'Vaishali Patel', 29, 'Female', 'PATIENT', 'GEN PATIENT', 'Dhavda', '9033886600', 'COMPLETED', '2026-02-01 18:52:07.512', '2026-02-01 18:55:00', '2026-02-01 19:10:00', 'Regular checkup. BP normal.', 'Paracetamol 500mg', FALSE, 0, 31),
('visit-20260201-002', 2, 'Meet D Pandya', 33, 'Male', 'PATIENT', 'REL PATIENT', 'Paris', '7359852000', 'COMPLETED', '2026-02-01 18:52:44.799', '2026-02-01 19:00:00', '2026-02-01 19:20:00', 'Follow-up visit', NULL, FALSE, 0, 32),
('visit-20260201-003', 3, 'Divyesh Panchal', 37, 'Male', 'PATIENT', 'GEN PATIENT', 'Tokyo', '1234567890', 'COMPLETED', '2026-02-01 19:15:11.486', '2026-02-01 19:25:00', '2026-02-01 19:40:00', NULL, NULL, FALSE, 0, 33),
('visit-20260201-004', 4, 'Manisha Dev Patel', 22, 'Female', 'PATIENT', 'GEN PATIENT', 'Dubai', '4564564560', 'COMPLETED', '2026-02-01 19:19:05.717', NULL, NULL, NULL, NULL, FALSE, 0, 34),
('visit-20260201-005', 5, 'Jayesh Manani', 33, 'Male', 'PATIENT', 'REF PATIENT', 'New York', '9879879870', 'COMPLETED', '2026-02-01 19:20:03.784', '2026-02-01 19:45:00', '2026-02-01 20:00:00', 'Referred by Dr. Shah', 'Amoxicillin 250mg', FALSE, 0, 35),
('visit-20260203-001', 1, 'Denisha Jain', 33, 'Female', 'PATIENT', 'GEN PATIENT', 'Dubai', '9090909090', 'COMPLETED', '2026-02-03 04:23:59.694', '2026-02-03 04:30:00', '2026-02-03 04:50:00', 'Fever and cold symptoms', 'Cetrizine 10mg, Paracetamol 650mg', FALSE, 0, 38),
('visit-20260203-002', 2, 'Mayank Patidar', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'Toronto', '9494949494', 'COMPLETED', '2026-02-03 04:24:27.865', '2026-02-03 05:00:00', '2026-02-03 05:20:00', 'Scheduled for operation', NULL, FALSE, 0, 39),
('visit-20260207-001', 1, 'Piyush Varma', 30, 'Male', 'PATIENT', 'GEN PATIENT', 'Tokyo', '9033334444', 'WAITING', '2026-02-07 07:15:25.192', NULL, NULL, NULL, NULL, FALSE, 1, 45);

-- =============================================
-- INSERT DATA - EVENTS (6 rows)
-- =============================================

INSERT INTO events (id, title, event_date, event_time, description, event_type, remind_me, created_by, created_at, updated_at) VALUES
(1, 'Visit to Hospital Opening', '2026-01-31', '06:30:00', 'Visit to KD Hospital opening. Invited by DR. Shah', 'VISIT', true, 'OPERATOR', '2026-01-30 12:03:59.340302', '2026-01-30 12:03:59.340302'),
(3, 'Meeting with Dr. Sinha', '2026-01-30', '22:05:00', 'Dr Sinha at Zydus Meeting', 'VISIT', true, 'OPERATOR', '2026-01-30 15:09:33.006483', '2026-01-30 15:09:33.006483'),
(4, 'Operation Schedule for Mayank', '2026-02-03', '20:05:00', 'Mr. Mayank Patidar', 'OPERATION', true, 'OPERATOR', '2026-02-03 04:27:38.660483', '2026-02-03 12:35:25.374699'),
(5, 'Tvishaa Birthday', '2026-02-21', '18:00:00', NULL, 'NORMAL', false, 'OPERATOR', '2026-02-03 14:17:54.489518', '2026-02-03 14:17:54.489518'),
(6, 'Hetal Birthday', '2026-02-12', '20:50:00', 'Hetal Birthday at Sankus Hotel', 'NORMAL', true, 'OPERATOR', '2026-02-03 14:18:26.474078', '2026-02-03 14:18:26.474078'),
(7, 'Today Event to mall', '2026-02-06', '20:15:00', 'Mall VIsit for Purchase', 'VISIT', false, 'OPERATOR', '2026-02-06 10:41:52.572626', '2026-02-06 10:41:52.572626');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));

-- =============================================
-- INSERT DATA - PLAN INQUIRIES (1 row)
-- =============================================

INSERT INTO plan_inquiries (id, name, hospital_name, address, mobile, email, plan_type, days, amount, created_at) VALUES
(3, 'Mayank Patel', 'Jivan Shree Orthopedic', 'Main Bazar, Sola
Nr. Vasukaka, Gota', '9878986599', 'doc.123@gmail.com', 'PAID SUPPORT PLAN', 30, 750, '2026-02-06 06:22:26.461435');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('plan_inquiries_id_seq', (SELECT MAX(id) FROM plan_inquiries));

-- =============================================
-- SAMPLE MESSAGES (demo data)
-- =============================================
-- Note: This contains representative sample messages. Your production
-- database may contain additional message records.

INSERT INTO messages (id, patient_id, text, sender, timestamp) VALUES
('msg-20260201-001', 'visit-20260201-001', 'Patient is here for regular checkup', 'OPERATOR', 1738436527000),
('msg-20260201-002', 'visit-20260201-001', 'OK send her in', 'DOCTOR', 1738436700000),
('msg-20260201-003', 'visit-20260201-005', 'Referred by Dr. Shah from KD Hospital', 'OPERATOR', 1738438803000),
('msg-20260203-001', 'visit-20260203-002', 'Patient needs operation scheduling', 'OPERATOR', 1738555467000),
('msg-20260203-002', 'visit-20260203-002', 'Schedule for today evening', 'DOCTOR', 1738555500000);

-- =============================================
-- VERIFY DATA
-- =============================================

-- Uncomment to verify after import:
-- SELECT COUNT(*) AS patient_count FROM patient;
-- SELECT COUNT(*) AS visit_count FROM visits;
-- SELECT COUNT(*) AS event_count FROM events;
-- SELECT COUNT(*) AS message_count FROM messages;
-- SELECT COUNT(*) AS plan_inquiry_count FROM plan_inquiries;

-- =============================================
-- END OF BACKUP
-- =============================================
