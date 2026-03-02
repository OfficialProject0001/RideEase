CREATE DATABASE IF NOT EXISTS rideease_db;
USE rideease_db;

CREATE TABLE rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pickup VARCHAR(255) NOT NULL,
    drop_loc VARCHAR(255) NOT NULL,
    fare DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending'
);
