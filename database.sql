
CREATE DATABASE IF NOT EXISTS clinic_flow;
USE clinic_flow;

-- Table for patient and visitor records
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    queueId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female'),
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    mobile VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    createdAt BIGINT NOT NULL,
    inTime BIGINT,
    outTime BIGINT,
    notes TEXT,
    medicines TEXT,
    hasUnreadAlert BOOLEAN DEFAULT FALSE
);

-- Table for discussion history
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    patientId VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);
