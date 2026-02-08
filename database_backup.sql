-- Clinic-Q Database Backup
-- Generated: February 8, 2026
-- Version: 1.50

-- =============================================
-- DROP EXISTING TABLES (if running fresh)
-- =============================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS plan_inquiries CASCADE;
DROP TABLE IF EXISTS complaint_tags CASCADE;
DROP TABLE IF EXISTS diagnosis_tags CASCADE;
DROP TABLE IF EXISTS medicine_tags CASCADE;
DROP TABLE IF EXISTS app_sett CASCADE;

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table (each clinic visit record with vitals and prescriptions)
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    in_time TIMESTAMP WITH TIME ZONE,
    out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    medicines TEXT,
    has_unread_alert BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    patient_id INTEGER REFERENCES patient(id),
    bp VARCHAR(20),
    temperature NUMERIC,
    pulse INTEGER,
    weight NUMERIC,
    spo2 INTEGER,
    complaints JSONB DEFAULT '[]'::jsonb,
    diagnosis JSONB DEFAULT '[]'::jsonb,
    prescription JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    follow_up_date DATE
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Complaint Tags Table (auto-learning complaint suggestions)
CREATE TABLE complaint_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagnosis Tags Table (auto-learning diagnosis suggestions)
CREATE TABLE diagnosis_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Tags Table (auto-learning medicine name suggestions)
CREATE TABLE medicine_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- App Settings Table (application license/subscription settings)
CREATE TABLE app_sett (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    recharge_value NUMERIC NOT NULL DEFAULT 900,
    day_cost NUMERIC NOT NULL DEFAULT 30,
    number_of_days INTEGER NOT NULL DEFAULT 30,
    end_date DATE NOT NULL
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
-- INSERT DATA - PATIENT MASTER (56 rows)
-- =============================================

INSERT INTO patient (id, name, age, gender, city, mobile, created_at) VALUES
(1, 'Anand Ratnani', 25, 'Male', 'New York', NULL, '2026-01-26 10:01:20.523+00'),
(2, 'Arunaben Limbani', 25, 'Female', 'New York', NULL, '2026-01-26 10:01:46.073+00'),
(3, 'BHARAT PATEL', 25, 'Male', 'New York', '903333656652', '2026-01-26 09:59:46.895+00'),
(4, 'Bajaj Jindal', 25, 'Male', 'New York', NULL, '2026-01-27 06:25:00.658+00'),
(5, 'Bhavin Thakkar', 25, 'Male', 'New York', '9845124578', '2026-01-27 03:15:56.155+00'),
(6, 'Binal Patel', 32, 'Female', 'New York', NULL, '2026-01-27 03:16:16.31+00'),
(7, 'Chetan Rudani', 32, 'Male', 'Toronto', '9865326598', '2026-01-26 10:00:04.865+00'),
(8, 'David Mayor', 25, 'Male', 'New York', '989898', '2026-01-27 05:13:39.232+00'),
(9, 'David Tendulkar', 25, 'Male', 'New York', '15515151', '2026-01-27 06:04:32.9+00'),
(10, 'Deena Vasani', 25, 'Female', 'New York', NULL, '2026-01-26 10:03:19.061+00'),
(11, 'Denish Patel', 25, 'Male', 'New York', '9865321245', '2026-01-28 16:06:28.008+00'),
(12, 'Hetal Bhagat', 25, 'Male', 'New York', NULL, '2026-01-27 03:16:54.381+00'),
(13, 'Maya Ben Prajapati', 25, 'Female', 'Paris', NULL, '2026-01-27 06:42:49.154+00'),
(14, 'Mayur Patel', 43, 'Female', 'Tokyo', '444444', '2026-01-27 05:14:34.326+00'),
(15, 'Mayur Patel Bhimani', 25, 'Male', 'Sydney', NULL, '2026-01-28 17:28:54.861+00'),
(16, 'Pankaj Lawyer', 25, 'Male', 'New York', NULL, '2026-01-27 05:14:21.765+00'),
(17, 'Pankaj Singa', 25, 'Male', 'New York', NULL, '2026-01-26 10:01:32.053+00'),
(18, 'Praveen patekl', 25, 'Male', 'New York', NULL, '2026-01-27 06:25:10.777+00'),
(19, 'Pushpa bhau', 25, 'Male', 'New York', NULL, '2026-01-27 06:42:35.974+00'),
(20, 'Sandeep Patel', 25, 'Male', 'New York', '09033338800', '2026-01-27 06:25:32.569+00'),
(21, 'Suresh Nayani', 25, 'Male', 'New York', NULL, '2026-01-26 10:02:43.105+00'),
(22, 'TVISHAA PATEL', 25, 'Female', 'New York', NULL, '2026-01-26 10:00:57.107+00'),
(23, 'Vijay Manani', 25, 'Male', 'New York', '1245789865', '2026-01-27 03:16:08.306+00'),
(24, 'Vipul Sudhar', 25, 'Male', 'Sydney', '9865326598', '2026-01-26 10:00:19.143+00'),
(25, 'Vishal Jain M', 25, 'Male', 'New York', NULL, '2026-01-27 06:21:41.59+00'),
(26, 'VAIDIK SANDEEP BHAGAT', 25, 'Male', 'Berlin', '9098653265', '2026-01-30 08:01:52.319+00'),
(27, 'Mittal Shah', 22, 'Female', 'Toronto', '1234567890', '2026-01-30 08:11:02.539+00'),
(28, 'Vishah K Patel', 25, 'Male', 'Singapore', '1000010000', '2026-01-30 08:13:08.295+00'),
(29, 'Mittal Tendulkar', 25, 'Female', 'Paris', '15515151', '2026-01-30 10:19:33.223+00'),
(30, 'Vishal Manani', 30, 'Male', 'Toronto', '9427513371', '2026-01-30 11:35:36.975+00'),
(31, 'Vaishali Patel', 29, 'Female', 'Dhavda', '9033886600', '2026-02-01 18:52:07.512+00'),
(32, 'Meet D Pandya', 33, 'Male', 'Paris', '7359852000', '2026-02-01 18:52:44.799+00'),
(33, 'Divyesh Panchal', 37, 'Male', 'Tokyo', '1234567890', '2026-02-01 19:15:11.486+00'),
(34, 'Manisha Dev Patel', 22, 'Female', 'Dubai', '4564564560', '2026-02-01 19:19:05.717+00'),
(35, 'Jayesh Manani', 33, 'Male', 'New York', '9879879870', '2026-02-01 19:20:03.784+00'),
(36, 'Parthi Varsani', 36, 'Male', 'Sydney', NULL, '2026-02-01 19:20:41.21+00'),
(37, 'Mayur BHAGAT', 34, 'Male', 'Dhavda', '9427513366', '2026-02-02 07:25:59.884+00'),
(38, 'Denisha Jain', 33, 'Female', 'Dubai', '9090909090', '2026-02-03 04:23:59.694+00'),
(39, 'Mayank Patidar', 25, 'Male', 'Toronto', '9494949494', '2026-02-03 04:24:27.865+00'),
(40, 'Shruti Limbani', 41, 'Female', 'Paris', '9595959595', '2026-02-03 04:24:51.923+00'),
(41, 'Manilal Nayani', 25, 'Male', 'Berlin', '9494158578', '2026-02-03 06:23:09.807+00'),
(42, 'Vishal Kesharani', 25, 'Male', 'New York', '9639639630', '2026-02-03 09:43:00.249+00'),
(43, 'Test Patient', 30, 'Male', 'Ahmedabad', '9876543210', '2026-02-06 10:33:35+00'),
(44, '9066906600', 25, 'Female', 'Paris', 'Mitali Sing', '2026-02-06 10:35:54.697+00'),
(45, 'Piyush Varma', 30, 'Male', 'Tokyo', '9033334444', '2026-02-07 07:15:25.192+00'),
(46, 'Dinial K. Rupala', 36, 'Male', 'Dubai', '9494158745', '2026-02-07 07:15:49.446+00'),
(47, 'Vipul D. Parasiya', 36, 'Male', 'Nakhatrana - નખત્રાણા', '9725013371', '2026-02-07 18:58:34.881+00'),
(48, 'Vipul Karsariya', 27, 'Male', 'Berlin', '9475094750', '2026-02-07 19:31:22.146+00'),
(49, 'Bhagwatiben Patel', 35, 'Female', 'London', '8080707050', '2026-02-07 19:36:21.939+00'),
(50, 'Suresh B Surani', 36, 'Male', 'Vithon', '9696969696', '2026-02-07 20:05:29.167+00'),
(51, 'Rushil Darji', 18, 'Male', NULL, '7359852000', '2026-02-08 08:05:42.781+00'),
(52, 'Raiyalal K Bhagat', 63, 'Male', 'Tokyo', '9427094279', '2026-02-08 08:28:02.129+00'),
(53, 'Harshaben Limbani', 34, 'Female', 'Toronto', '9797250010', '2026-02-08 08:33:05.044+00'),
(54, 'Bhavin B Surani', 35, 'Male', 'Dhavda - ધાવડા', '9878997899', '2026-02-08 08:37:48.397+00'),
(55, 'Mittal D Vyas', 27, 'Male', 'Mumbai', '5689562356', '2026-02-08 08:50:04.089+00'),
(56, 'Bhavik R Ruparel', 42, 'Male', 'Dubai', '9797599990', '2026-02-08 08:51:59.852+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('patient_id_seq', (SELECT MAX(id) FROM patient));

-- =============================================
-- INSERT DATA - COMPLAINT TAGS (4 rows)
-- =============================================

INSERT INTO complaint_tags (id, name, usage_count, created_at) VALUES
(1, 'Headache', 7, '2026-02-07 19:54:11.585292+00'),
(2, 'Fever', 7, '2026-02-07 19:55:36.48219+00'),
(5, 'Allergy', 1, '2026-02-07 20:07:56.750635+00'),
(15, 'Vomiting', 1, '2026-02-08 08:51:27.311647+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('complaint_tags_id_seq', (SELECT MAX(id) FROM complaint_tags));

-- =============================================
-- INSERT DATA - DIAGNOSIS TAGS (3 rows)
-- =============================================

INSERT INTO diagnosis_tags (id, name, usage_count, created_at) VALUES
(1, 'Yellow Fever', 6, '2026-02-07 19:54:11.588082+00'),
(3, 'Thyroide', 1, '2026-02-07 20:07:56.753009+00'),
(8, 'Liver Infection', 2, '2026-02-08 08:51:27.313214+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('diagnosis_tags_id_seq', (SELECT MAX(id) FROM diagnosis_tags));

-- =============================================
-- INSERT DATA - MEDICINE TAGS (6 rows)
-- =============================================

INSERT INTO medicine_tags (id, name, usage_count, created_at) VALUES
(1, 'Paracitamol', 2, '2026-02-07 19:54:11.591253+00'),
(2, 'Ciplox', 1, '2026-02-07 19:54:11.594125+00'),
(3, 'Nioxinatone', 5, '2026-02-07 19:55:36.4989+00'),
(4, 'Ciplox D200', 1, '2026-02-07 20:07:56.764285+00'),
(5, 'Pimotrex OZ', 1, '2026-02-07 20:07:56.767192+00'),
(10, 'Ciplex 200', 1, '2026-02-08 08:51:27.31651+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('medicine_tags_id_seq', (SELECT MAX(id) FROM medicine_tags));

-- =============================================
-- INSERT DATA - APP SETTINGS (1 row)
-- =============================================

INSERT INTO app_sett (id, start_date, recharge_value, day_cost, number_of_days, end_date) VALUES
(1, '2026-02-08', 900, 30, 30, '2026-03-08');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('app_sett_id_seq', (SELECT MAX(id) FROM app_sett));

-- =============================================
-- INSERT DATA - VISITS (representative sample)
-- =============================================
-- Note: This contains representative sample visits. Your production
-- database may contain additional visit records.

INSERT INTO visits (id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, out_time, notes, medicines, has_unread_alert, sort_order, patient_id, bp, temperature, pulse, weight, spo2, complaints, diagnosis, prescription, advice, follow_up_date) VALUES
('b8873a69-edec-4d41-87b9-505c0ebaf2f4', 1, 'Bhagwatiben Patel', 35, 'Female', 'PATIENT', 'GEN PATIENT', 'London', '8080707050', 'OPD', '2026-02-07 19:36:21.939+00', '2026-02-07 19:36:21.939+00', NULL, NULL, NULL, FALSE, 0, 49, '120/82', 99.0, 84, 72.0, 99, '["Fever", "Headache"]'::jsonb, '["Yellow Fever"]'::jsonb, '[{"days": "1", "dose": "1", "name": "Nioxinatone", "type": "Inj", "instructions": "After Food"}]'::jsonb, NULL, '2026-02-15'),
('66139adb-6fe4-4d62-9dd1-6e7a65fb7320', 2, 'Suresh B Surani', 36, 'Male', 'PATIENT', 'GEN PATIENT', 'Vithon', '9696969696', 'COMPLETED', '2026-02-07 20:05:29.167+00', '2026-02-07 20:05:29.167+00', '2026-02-08 08:43:47.192+00', NULL, NULL, FALSE, 0, 50, NULL, NULL, NULL, NULL, NULL, '["Fever", "Allergy"]'::jsonb, '["Thyroide"]'::jsonb, '[{"days": "8", "dose": "1-0-1", "name": "Ciplox D200", "type": "Tab", "instructions": "Before Food"}, {"days": "8", "dose": "0-0-1", "name": "Pimotrex OZ", "type": "Drops", "instructions": "After Food"}]'::jsonb, NULL, '2026-02-16'),
('eec8cae0-0c66-46a0-bd41-2ec513ccf9ad', 4, 'Harshaben Limbani', 34, 'Female', 'PATIENT', 'GEN PATIENT', 'Toronto', '9797250010', 'COMPLETED', '2026-02-08 08:33:05.044+00', '2026-02-08 08:33:05.044+00', '2026-02-08 08:51:27.587+00', NULL, NULL, FALSE, 0, 53, '118/36', 98.0, 88, 69.0, 99, '["Fever", "Vomiting"]'::jsonb, '["Liver Infection"]'::jsonb, '[{"days": "7", "dose": "1-0-1", "name": "Ciplex 200", "type": "Tab", "instructions": "After Food"}]'::jsonb, NULL, '2026-02-15'),
('a495f333-15a2-4062-a714-720903b1a343', 5, 'Bhavin B Surani', 35, 'Male', 'PATIENT', 'GEN PATIENT', 'Dhavda - ધાવડા', '9878997899', 'COMPLETED', '2026-02-08 08:37:48.397+00', '2026-02-08 08:37:48.397+00', '2026-02-08 10:13:02.728+00', NULL, NULL, FALSE, 0, 54, NULL, NULL, NULL, NULL, NULL, '["Headache"]'::jsonb, '["Liver Infection"]'::jsonb, '[{"days": "10", "dose": "0-1-0", "name": "Paracitamol", "type": "Tab", "instructions": "After Food"}]'::jsonb, NULL, '2026-02-16'),
('d36c0e1c-2d23-4f8e-85ba-c5222dacdd6f', 1, 'Piyush Varma', 30, 'Male', 'PATIENT', 'GEN PATIENT', 'Tokyo', '9033334444', 'COMPLETED', '2026-02-07 07:15:25.192+00', '2026-02-07 07:15:25.192+00', '2026-02-07 15:39:13.422+00', E'Fever 102\nBP 138', 'Paracetamol Tab 32 5 Days', FALSE, 0, 45, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL),
('5ae3a9cc-ebf5-4b17-8ee4-27f889b9bf42', 6, 'Mittal D Vyas', 27, 'Male', 'PATIENT', 'GEN PATIENT', 'Mumbai', '5689562356', 'WAITING', '2026-02-08 08:50:04.089+00', '2026-02-08 08:50:04.089+00', NULL, NULL, NULL, FALSE, 1, 55, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL),
('e989fb8e-02f6-4895-b4a3-a35be1901258', 7, 'Bhavik R Ruparel', 42, 'Male', 'PATIENT', 'GEN PATIENT', 'Dubai', '9797599990', 'WAITING', '2026-02-08 08:51:59.852+00', '2026-02-08 08:51:59.852+00', NULL, NULL, NULL, FALSE, 2, 56, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL),
('4f4f2df2-61c2-4ec1-bb65-ae224f2d906a', 2, 'Vaishali Patel', 29, 'Female', 'PATIENT', 'GEN PATIENT', 'Dhavda', '9033886600', 'COMPLETED', '2026-02-01 18:52:07.512+00', '2026-02-01 18:52:07.512+00', '2026-02-01 19:15:41.422+00', NULL, NULL, FALSE, 0, 31, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL);

-- =============================================
-- INSERT DATA - EVENTS (6 rows)
-- =============================================

INSERT INTO events (id, title, event_date, event_time, description, event_type, remind_me, created_by, created_at, updated_at) VALUES
(1, 'Visit to Hospital Opening', '2026-01-31', '06:30:00', 'Visit to KD Hospital opening. Invited by DR. Shah', 'VISIT', true, 'OPERATOR', '2026-01-30 12:03:59.340302+00', '2026-01-30 12:03:59.340302+00'),
(3, 'Meeting with Dr. Sinha', '2026-01-30', '22:05:00', 'Dr Sinha at Zydus Meeting', 'VISIT', true, 'OPERATOR', '2026-01-30 15:09:33.006483+00', '2026-01-30 15:09:33.006483+00'),
(4, 'Operation Schedule for Mayank', '2026-02-03', '20:05:00', 'Mr. Mayank Patidar', 'OPERATION', true, 'OPERATOR', '2026-02-03 04:27:38.660483+00', '2026-02-03 12:35:25.374699+00'),
(5, 'Tvishaa Birthday', '2026-02-21', '18:00:00', NULL, 'NORMAL', false, 'OPERATOR', '2026-02-03 14:17:54.489518+00', '2026-02-03 14:17:54.489518+00'),
(6, 'Hetal Birthday', '2026-02-12', '20:50:00', 'Hetal Birthday at Sankus Hotel', 'NORMAL', true, 'OPERATOR', '2026-02-03 14:18:26.474078+00', '2026-02-03 14:18:26.474078+00'),
(7, 'Today Event to mall', '2026-02-06', '20:15:00', 'Mall VIsit for Purchase', 'VISIT', false, 'OPERATOR', '2026-02-06 10:41:52.572626+00', '2026-02-06 10:41:52.572626+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));

-- =============================================
-- INSERT DATA - PLAN INQUIRIES (1 row)
-- =============================================

INSERT INTO plan_inquiries (id, name, hospital_name, address, mobile, email, plan_type, days, amount, created_at) VALUES
(3, 'Mayank Patel', 'Jivan Shree Orthopedic', E'Main Bazar, Sola\nNr. Vasukaka, Gota', '9878986599', 'doc.123@gmail.com', 'PAID SUPPORT PLAN', 30, 750, '2026-02-06 06:22:26.461435+00');

-- Reset the sequence to continue after the last inserted ID
SELECT setval('plan_inquiries_id_seq', (SELECT MAX(id) FROM plan_inquiries));

-- =============================================
-- SAMPLE MESSAGES (representative data)
-- =============================================
-- Note: This contains representative sample messages. Your production
-- database may contain additional message records.

INSERT INTO messages (id, patient_id, text, sender, timestamp) VALUES
('81b2dd6d-ddfc-4c12-a7c0-ca10e06feed6', '5afd8109-db29-457d-bf25-1cff69c84395', 'hi', 'OPERATOR', 1769421933827),
('a1c6b4c8-c091-482b-bd84-d15053df5013', '5afd8109-db29-457d-bf25-1cff69c84395', 'Bolo', 'DOCTOR', 1769421946436),
('d0559850-a4b9-4b29-8d41-cd30ef6b0d3a', '5ae3a9cc-ebf5-4b17-8ee4-27f889b9bf42', 'Blood Report', 'DOCTOR', 1770541352048),
('ef952e83-23d0-4b44-a086-2d8af62f1ebf', 'add07bdb-fd9b-4601-b498-26c09b33f269', 'hi', 'OPERATOR', 1770197365261),
('d6004b5c-fb05-4706-b60d-97258282e3fb', 'add07bdb-fd9b-4601-b498-26c09b33f269', 'ok', 'DOCTOR', 1770197371630);

-- =============================================
-- VERIFY DATA
-- =============================================

-- Uncomment to verify after import:
-- SELECT COUNT(*) AS patient_count FROM patient;
-- SELECT COUNT(*) AS visit_count FROM visits;
-- SELECT COUNT(*) AS event_count FROM events;
-- SELECT COUNT(*) AS message_count FROM messages;
-- SELECT COUNT(*) AS plan_inquiry_count FROM plan_inquiries;
-- SELECT COUNT(*) AS complaint_tag_count FROM complaint_tags;
-- SELECT COUNT(*) AS diagnosis_tag_count FROM diagnosis_tags;
-- SELECT COUNT(*) AS medicine_tag_count FROM medicine_tags;
-- SELECT COUNT(*) AS app_sett_count FROM app_sett;

-- =============================================
-- END OF BACKUP
-- =============================================
