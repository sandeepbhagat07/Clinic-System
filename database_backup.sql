-- ClinicFlow Database Backup
-- Generated: January 27, 2026
-- Version: 1.14

-- =============================================
-- DROP EXISTING TABLES (if running fresh)
-- =============================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Patients Table
CREATE TABLE patients (
    id VARCHAR(36) PRIMARY KEY,
    queue_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    mobile VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    in_time TIMESTAMP,
    out_time TIMESTAMP,
    notes TEXT,
    medicines TEXT,
    has_unread_alert BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

-- Messages Table
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL
);

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_patients_queue_id ON patients(queue_id);
CREATE INDEX idx_messages_patient_id ON messages(patient_id);

-- =============================================
-- INSERT SAMPLE DATA - PATIENTS
-- =============================================

INSERT INTO patients (id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, out_time, notes, medicines, has_unread_alert, sort_order) VALUES
('b5cd8de4-a1e5-4f0d-930c-3a14f0e868be', 1, 'BHARAT PATEL', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', '903333656652', 'COMPLETED', '2026-01-26 09:59:46.895', '2026-01-26 09:59:46.895', '2026-01-26 10:00:42.255', 'Blood Report', 'Medicine 12', FALSE, 0),
('70a4fac5-226f-483c-b3bc-45992fac7381', 2, 'Chetan Rudani', 32, 'Male', 'PATIENT', 'REF PATIENT', 'Toronto', '9865326598', 'WAITING', '2026-01-26 10:00:04.865', '2026-01-26 10:00:04.865', NULL, NULL, NULL, FALSE, 1),
('ca730db7-d8a6-4e28-a5b3-18b9f2b47f83', 0, 'Vipul Sudhar', 25, 'Male', 'VISITOR', 'RELATIVE', 'Sydney', '9865326598', 'COMPLETED', '2026-01-26 10:00:19.143', '2026-01-26 10:00:19.143', '2026-01-26 10:01:12.397', NULL, NULL, FALSE, 0),
('6df3e013-1614-4402-89b9-bf76f46050f6', 3, 'TVISHAA PATEL', 25, 'Female', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-26 10:00:57.107', '2026-01-26 10:00:57.107', '2026-01-26 10:03:11.936', NULL, NULL, FALSE, 0),
('5afd8109-db29-457d-bf25-1cff69c84395', 4, 'Anand Ratnani', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'WAITING', '2026-01-26 10:01:20.523', '2026-01-26 10:01:20.523', NULL, NULL, NULL, FALSE, 2),
('7bb9025c-518a-4c47-892c-21d94b960099', 0, 'Pankaj Singa', 25, 'Male', 'VISITOR', 'MR', 'New York', NULL, 'WAITING', '2026-01-26 10:01:32.053', '2026-01-26 10:01:32.053', NULL, NULL, NULL, FALSE, 4),
('7347fea1-5c6c-4c60-9a86-5893282ee6b2', 0, 'Arunaben Limbani', 25, 'Female', 'VISITOR', 'FAMILY', 'New York', NULL, 'COMPLETED', '2026-01-26 10:01:46.073', '2026-01-26 10:01:46.073', '2026-01-26 11:34:09.342', NULL, NULL, FALSE, 0),
('72cbea05-d979-4953-8440-3cdcd7e925d8', 5, 'Suresh Nayani', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'WAITING', '2026-01-26 10:02:43.105', '2026-01-26 10:02:43.105', NULL, NULL, NULL, FALSE, 3),
('ad867b25-fc54-424a-bba3-ee595138d647', 6, 'Deena Vasani', 25, 'Female', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'WAITING', '2026-01-26 10:03:19.061', '2026-01-26 10:03:19.061', NULL, NULL, NULL, FALSE, 5),
('e4c2fcc1-1f9d-4ed3-a0e5-2d8e1aaeaa8a', 1, 'Bhavin Thakkar', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', '9845124578', 'COMPLETED', '2026-01-27 03:15:56.155', '2026-01-27 03:15:56.155', '2026-01-27 06:38:04.378', NULL, NULL, FALSE, 0),
('b120d721-4a9b-4b6f-85e8-c662a7ba4cb5', 2, 'Vijay Manani', 25, 'Male', 'PATIENT', 'REF PATIENT', 'New York', '1245789865', 'COMPLETED', '2026-01-27 03:16:08.306', '2026-01-27 03:16:08.306', '2026-01-27 05:14:00.159', NULL, NULL, FALSE, 0),
('23d0b8b1-7afe-43f6-bd7a-017ecaa1312d', 3, 'Binal Patel', 32, 'Female', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 03:16:16.31', '2026-01-27 03:16:16.31', '2026-01-27 05:13:14.81', NULL, NULL, TRUE, 0),
('3ee03693-ce2b-4b10-b7f8-a0957342a8c5', 0, 'Hetal Bhagat', 25, 'Male', 'VISITOR', 'FAMILY', 'New York', NULL, 'COMPLETED', '2026-01-27 03:16:54.381', '2026-01-27 03:16:54.381', '2026-01-27 05:13:23.445', NULL, NULL, FALSE, 0),
('042839aa-efce-4b07-b52d-44df8de1e90a', 4, 'David Mayor', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', '989898', 'COMPLETED', '2026-01-27 05:13:39.232', '2026-01-27 05:13:39.232', '2026-01-27 05:13:42.255', NULL, NULL, FALSE, 0),
('28c5a7b8-dd9f-4cb0-b079-bc6ce048597b', 5, 'Pankaj Lawyer', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 05:14:21.765', '2026-01-27 05:14:21.765', '2026-01-27 05:14:44.689', NULL, NULL, FALSE, 0),
('94fb54b0-4985-49f8-86f9-a1a9526d4299', 6, 'Mayur Patel', 43, 'Female', 'PATIENT', 'GEN PATIENT', 'Tokyo', '444444', 'COMPLETED', '2026-01-27 05:14:34.326', '2026-01-27 05:14:34.326', '2026-01-27 05:16:26.111', NULL, NULL, FALSE, 0),
('cd75afe5-4b18-47e1-abe7-1309fbbf0ed5', 7, 'David Tendulkar', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', '15515151', 'COMPLETED', '2026-01-27 06:04:32.9', '2026-01-27 06:04:32.9', '2026-01-27 06:04:37.783', NULL, NULL, FALSE, 0),
('63145892-1d50-4813-82ce-7a8943b5c7c2', 8, 'Vishal Jain M', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 06:21:41.59', '2026-01-27 06:21:41.59', '2026-01-27 06:21:52.808', NULL, NULL, FALSE, 0),
('7c99b587-e3cc-4bd7-99fc-4b57270dd3d6', 9, 'Bajaj Jindal', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 06:25:00.658', '2026-01-27 06:25:00.658', '2026-01-27 06:25:17.656', NULL, NULL, FALSE, 0),
('d1abc216-0481-495c-9e1b-f326f551cc3b', 10, 'Praveen patekl', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 06:25:10.777', '2026-01-27 06:25:10.777', '2026-01-27 06:42:21.811', NULL, NULL, FALSE, 0),
('56b2fdfb-4f52-4843-bda8-f6bbe89fe274', 11, 'Sandeep Patel', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', '09033338800', 'COMPLETED', '2026-01-27 06:25:32.569', '2026-01-27 06:25:32.569', '2026-01-27 06:34:21.94', NULL, NULL, FALSE, 0),
('abf11798-751b-4f4a-a6af-4dd6ffc7a758', 12, 'Pushpa bhau', 25, 'Male', 'PATIENT', 'GEN PATIENT', 'New York', NULL, 'COMPLETED', '2026-01-27 06:42:35.974', '2026-01-27 06:42:35.974', '2026-01-27 10:42:36.176', NULL, NULL, FALSE, 0),
('9b4de867-4b9b-4199-a5a5-ed719cd44580', 13, 'Maya Ben Prajapati', 25, 'Female', 'PATIENT', 'GEN PATIENT', 'Paris', NULL, 'OPD', '2026-01-27 06:42:49.154', '2026-01-27 06:42:49.154', NULL, NULL, NULL, FALSE, 0);

-- =============================================
-- INSERT SAMPLE DATA - MESSAGES
-- =============================================

INSERT INTO messages (id, patient_id, text, sender, timestamp) VALUES
('81b2dd6d-ddfc-4c12-a7c0-ca10e06feed6', '5afd8109-db29-457d-bf25-1cff69c84395', 'hi', 'OPERATOR', 1769421933827),
('a1c6b4c8-c091-482b-bd84-d15053df5013', '5afd8109-db29-457d-bf25-1cff69c84395', 'Bolo', 'DOCTOR', 1769421946436),
('995b6219-f987-448e-9af3-8729c2454aad', '23d0b8b1-7afe-43f6-bd7a-017ecaa1312d', 'Report', 'DOCTOR', 1769490774277),
('3340a2a9-8417-407e-9647-5dc8fd45703c', '23d0b8b1-7afe-43f6-bd7a-017ecaa1312d', 'OK', 'OPERATOR', 1769490779260);

-- =============================================
-- VERIFY DATA
-- =============================================

-- Uncomment to verify after import:
-- SELECT COUNT(*) AS patient_count FROM patients;
-- SELECT COUNT(*) AS message_count FROM messages;

-- =============================================
-- END OF BACKUP
-- =============================================
