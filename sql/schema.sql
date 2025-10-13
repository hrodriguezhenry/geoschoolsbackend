-- Schema for GeoSchools
CREATE DATABASE IF NOT EXISTS geoschools DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE geoschools;

DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS municipalities;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  department_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE municipalities (
  municipality_id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  CONSTRAINT fk_muni_dept FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schools (
  school_id INT PRIMARY KEY AUTO_INCREMENT,
  municipality_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  sector ENUM('publico','privado','cooperativa') NOT NULL,
  level_name VARCHAR(100) NULL,
  address_text VARCHAR(255) NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  CONSTRAINT fk_school_muni FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id)
);

CREATE TABLE reviews (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  user_id INT NULL,
  user_full_name VARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(500) NULL,
  cost DECIMAL(10,2) NULL,
  CONSTRAINT fk_review_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE KEY uniq_user_school (user_id, school_id)
);

CREATE TABLE favorites (
  user_id INT NOT NULL,
  school_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, school_id),
  CONSTRAINT fk_fav_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE password_resets (
  token VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(180) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
