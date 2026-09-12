-- =========================================================
-- KISAN SETU
-- Smart Farmer Procurement System
-- Smart India Hackathon 2026
-- Problem Statement: SIH26032
-- =========================================================

-- Create database
CREATE DATABASE IF NOT EXISTS KisanSetu;

USE KisanSetu;


-- =========================================================
-- 1. USERS TABLE
-- Stores farmer and staff login information
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'farmer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. CROPS TABLE
-- Stores crops added by farmers
-- =========================================================

CREATE TABLE IF NOT EXISTS crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 3. CENTRES TABLE
-- Stores procurement centre information
-- =========================================================

CREATE TABLE IF NOT EXISTS centres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 4. SLOTS TABLE
-- Stores available procurement time slots
-- =========================================================

CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT DEFAULT 20,
    booked_count INT DEFAULT 0,

    FOREIGN KEY (centre_id)
        REFERENCES centres(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. BOOKINGS TABLE
-- Stores farmer slot bookings and token numbers
-- =========================================================

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    centre_id INT NOT NULL,
    slot_id INT NOT NULL,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (centre_id)
        REFERENCES centres(id)
        ON DELETE CASCADE,

    FOREIGN KEY (slot_id)
        REFERENCES slots(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 6. QUEUE TABLE
-- Stores live farmer queue information
-- =========================================================

CREATE TABLE IF NOT EXISTS queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    farmer_id INT NOT NULL,
    centre_id INT NOT NULL,
    token_number VARCHAR(20) NOT NULL,
    position INT NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting',
    estimated_wait INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    FOREIGN KEY (farmer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (centre_id)
        REFERENCES centres(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. PROCUREMENT TABLE
-- Stores actual procurement details
-- =========================================================

CREATE TABLE IF NOT EXISTS procurement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    procurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    FOREIGN KEY (farmer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (crop_id)
        REFERENCES crops(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 8. PAYMENTS TABLE
-- Stores farmer payment information
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    farmer_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'Bank Transfer',
    transaction_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP NULL,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    FOREIGN KEY (farmer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- SAMPLE PROCUREMENT CENTRES
-- =========================================================

INSERT INTO centres
(name, location, capacity)
SELECT
    'Indore Mandi',
    'Indore, Madhya Pradesh',
    100
WHERE NOT EXISTS (
    SELECT 1 FROM centres
    WHERE name = 'Indore Mandi'
);


INSERT INTO centres
(name, location, capacity)
SELECT
    'Dewas Procurement Centre',
    'Dewas, Madhya Pradesh',
    80
WHERE NOT EXISTS (
    SELECT 1 FROM centres
    WHERE name = 'Dewas Procurement Centre'
);


INSERT INTO centres
(name, location, capacity)
SELECT
    'Ujjain Mandi',
    'Ujjain, Madhya Pradesh',
    100
WHERE NOT EXISTS (
    SELECT 1 FROM centres
    WHERE name = 'Ujjain Mandi'
);


-- =========================================================
-- VERIFY TABLES
-- =========================================================

SHOW TABLES;