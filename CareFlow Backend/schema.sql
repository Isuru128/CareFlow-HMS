-- ==============================================================================
-- CareFlow Hospital Management System (HMS)
-- Complete Database Schema (DDL: Tables, Constraints, Indexes & Triggers)
-- Target Database: PostgreSQL (Supabase Compatible)
-- Modules Covered: 3.1 User Management & RBAC
--                  3.2 Patient Management
--                  3.3 Doctor Management
--                  3.4 Appointment Management
--                  3.5 Electronic Medical Records (EMR)
--                  3.6 Laboratory Management
--                  3.7 Pharmacy Management
--                  3.8 Billing System & Admissions
--                  3.9 Staff Management
--                  3.10 Hospital Reports & Analytics
-- ==============================================================================

-- Enable UUID extension if required for future modules
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- Module 3.1 - User Management & RBAC
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Core user entity storing authentication credentials, personal profile,
-- security status, and login audit tracking.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED')),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. USER ROLES TABLE
-- Maps users to their designated roles (Enum-based RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (
        role IN (
            'ROLE_ADMIN',
            'ROLE_DOCTOR',
            'ROLE_NURSE',
            'ROLE_RECEPTIONIST',
            'ROLE_LABORATORY_STAFF',
            'ROLE_PHARMACIST',
            'ROLE_ACCOUNTANT'
        )
    ),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role)
);

-- ------------------------------------------------------------------------------
-- 3. REFRESH TOKENS TABLE
-- Facilitates secure login, token rotation, logout revocation, and session timeouts.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. PASSWORD RESET TOKENS TABLE
-- Stores single-use, time-limited cryptographic tokens for password reset workflows.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- Maintains immutable logs of all security actions, role assignments, and profile edits.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.1 (USER MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

DROP TRIGGER IF EXISTS trg_update_users_timestamp ON users;
CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.2 - Patient Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6. PATIENTS TABLE
-- Stores demographic, contact, emergency, and medical baseline information.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    patient_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    nic_or_passport VARCHAR(50),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    allergies TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECEASED')),
    registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. PATIENT MEDICAL HISTORY TABLE
-- Records diagnosed medical conditions, treatments, past surgeries, and notes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_or_diagnosis VARCHAR(255) NOT NULL,
    diagnosis_date DATE,
    treatment TEXT,
    surgeries TEXT,
    medications TEXT,
    notes TEXT,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. PATIENT DOCUMENTS TABLE
-- Stores metadata and storage references for uploaded patient documents
-- (e.g. lab reports, medical scans, discharge summaries, identification).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_documents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL CHECK (
        document_type IN ('LAB_REPORT', 'SCAN', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'ID_PROOF', 'OTHER')
    ),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    notes TEXT,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.2 (PATIENT MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_first_name ON patients(first_name);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_contact_number ON patients(contact_number);
CREATE INDEX IF NOT EXISTS idx_patients_nic_or_passport ON patients(nic_or_passport);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

CREATE INDEX IF NOT EXISTS idx_patient_medical_history_patient_id ON patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);

DROP TRIGGER IF EXISTS trg_update_patients_timestamp ON patients;
CREATE TRIGGER trg_update_patients_timestamp
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_patient_medical_history_timestamp ON patient_medical_history;
CREATE TRIGGER trg_update_patient_medical_history_timestamp
BEFORE UPDATE ON patient_medical_history
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.3 - Doctor Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 9. DEPARTMENTS TABLE
-- Clinical and administrative departments for doctor assignment.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    contact_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. DOCTORS TABLE
-- Profiles, medical licenses, specializations, departments, and consult fees.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id BIGSERIAL PRIMARY KEY,
    doctor_number VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    qualification VARCHAR(150) NOT NULL,
    experience_years INT,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    room_number VARCHAR(30),
    bio TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'RETIRED')),
    registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 11. DOCTOR SCHEDULES TABLE
-- Weekly recurring working schedules, slots, and capacity management.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (
        day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')
    ),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL DEFAULT 20,
    slot_duration_minutes INT NOT NULL DEFAULT 15,
    room_number VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doctor_schedule_day_time UNIQUE (doctor_id, day_of_week, start_time)
);


-- ==============================================================================
-- Module 3.4 - Appointment Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 12. APPOINTMENTS TABLE
-- Central appointment booking, scheduling, status tracking, and notes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    appointment_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    queue_number INT NOT NULL,
    appointment_type VARCHAR(30) NOT NULL DEFAULT 'CONSULTATION' CHECK (
        appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'ROUTINE_CHECKUP', 'EMERGENCY')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED')
    ),
    reason TEXT,
    notes TEXT,
    consultation_fee NUMERIC(10, 2),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    booked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULES 3.3 & 3.4 (DOCTORS & APPOINTMENTS)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

CREATE INDEX IF NOT EXISTS idx_doctors_doctor_number ON doctors(doctor_number);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day_of_week ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_is_active ON doctor_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_appointments_appointment_number ON appointments(appointment_number);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_department_id ON appointments(department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

DROP TRIGGER IF EXISTS trg_update_departments_timestamp ON departments;
CREATE TRIGGER trg_update_departments_timestamp
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_doctors_timestamp ON doctors;
CREATE TRIGGER trg_update_doctors_timestamp
BEFORE UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_doctor_schedules_timestamp ON doctor_schedules;
CREATE TRIGGER trg_update_doctor_schedules_timestamp
BEFORE UPDATE ON doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_appointments_timestamp ON appointments;
CREATE TRIGGER trg_update_appointments_timestamp
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.5 - Electronic Medical Records (EMR)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 13. MEDICAL RECORDS TABLE
-- Central clinical encounters, consultations, vital signs, and examination notes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGSERIAL PRIMARY KEY,
    record_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chief_complaint TEXT NOT NULL,
    examination_notes TEXT,
    clinical_notes TEXT,
    blood_pressure VARCHAR(20),
    temperature_celsius NUMERIC(4, 1),
    heart_rate_bpm INT,
    respiratory_rate_bpm INT,
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    bmi NUMERIC(4, 1),
    oxygen_saturation INT,
    status VARCHAR(20) NOT NULL DEFAULT 'FINALIZED' CHECK (status IN ('DRAFT', 'FINALIZED', 'ARCHIVED')),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 14. PATIENT DIAGNOSES TABLE
-- Records confirmed, provisional, primary, and secondary patient diagnoses.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id BIGSERIAL PRIMARY KEY,
    medical_record_id BIGINT REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    icd10_code VARCHAR(30),
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(30) NOT NULL DEFAULT 'PRIMARY' CHECK (
        diagnosis_type IN ('PRIMARY', 'SECONDARY', 'PROVISIONAL', 'DIFFERENTIAL', 'FINAL')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'CHRONIC', 'RESOLVED', 'IN_REMISSION')
    ),
    severity VARCHAR(30) CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE')),
    diagnosed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    resolved_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 15. PRESCRIPTIONS TABLE
-- Doctor-issued medication orders for patient pharmacy dispensing.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGSERIAL PRIMARY KEY,
    prescription_number VARCHAR(30) NOT NULL UNIQUE,
    medical_record_id BIGINT REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED', 'EXPIRED')
    ),
    instructions TEXT,
    notes TEXT,
    dispensed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 16. PRESCRIPTION ITEMS TABLE
-- Detailed pharmaceutical items, dosage, route, frequency, and duration.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescription_items (
    id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL DEFAULT 'ORAL' CHECK (
        route IN ('ORAL', 'INTRAVENOUS', 'INTRAMUSCULAR', 'TOPICAL', 'INHALATION', 'SUBLINGUAL', 'OPHTHALMIC', 'OTHER')
    ),
    duration VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    instructions TEXT,
    is_dispensed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------------------------
-- 17. TREATMENT HISTORIES TABLE
-- Procedures, therapies, interventions, outcomes, and progress tracking.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_histories (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL,
    doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
    treatment_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'MEDICATION_THERAPY' CHECK (
        category IN ('MEDICATION_THERAPY', 'SURGICAL_PROCEDURE', 'PHYSIOTHERAPY', 'WOUND_CARE', 'DIALYSIS', 'CHEMOTHERAPY', 'REHABILITATION', 'OTHER')
    ),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (
        status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DISCONTINUED', 'CANCELLED')
    ),
    outcome VARCHAR(50) CHECK (
        outcome IN ('RECOVERED', 'IMPROVED', 'UNCHANGED', 'DETERIORATED', 'NOT_EVALUATED')
    ),
    procedure_notes TEXT,
    complications TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 18. MEDICAL REPORTS TABLE
-- Clinical summaries, formal medical evaluations, and diagnostic reports.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_reports (
    id BIGSERIAL PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL UNIQUE,
    medical_record_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    report_title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (
        report_type IN ('CLINICAL_SUMMARY', 'DISCHARGE_SUMMARY', 'CONSULTATION_NOTE', 'DIAGNOSTIC_SUMMARY', 'SPECIALIST_REFERRAL', 'HEALTH_ASSESSMENT', 'OTHER')
    ),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clinical_findings TEXT NOT NULL,
    recommendations TEXT,
    summary TEXT,
    attachment_url VARCHAR(512),
    attachment_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'FINALIZED' CHECK (status IN ('DRAFT', 'FINALIZED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.5 (ELECTRONIC MEDICAL RECORDS)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_medical_records_record_number ON medical_records(record_number);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);

CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_record_id ON patient_diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_doctor_id ON patient_diagnoses(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_icd10 ON patient_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_status ON patient_diagnoses(status);

CREATE INDEX IF NOT EXISTS idx_prescriptions_rx_number ON prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_record_id ON prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_prescription_items_rx_id ON prescription_items(prescription_id);

CREATE INDEX IF NOT EXISTS idx_treatment_histories_patient_id ON treatment_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_histories_record_id ON treatment_histories(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_histories_status ON treatment_histories(status);

CREATE INDEX IF NOT EXISTS idx_medical_reports_report_number ON medical_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_doctor_id ON medical_reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_report_type ON medical_reports(report_type);

DROP TRIGGER IF EXISTS trg_update_medical_records_timestamp ON medical_records;
CREATE TRIGGER trg_update_medical_records_timestamp
BEFORE UPDATE ON medical_records
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_patient_diagnoses_timestamp ON patient_diagnoses;
CREATE TRIGGER trg_update_patient_diagnoses_timestamp
BEFORE UPDATE ON patient_diagnoses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_prescriptions_timestamp ON prescriptions;
CREATE TRIGGER trg_update_prescriptions_timestamp
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_treatment_histories_timestamp ON treatment_histories;
CREATE TRIGGER trg_update_treatment_histories_timestamp
BEFORE UPDATE ON treatment_histories
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_medical_reports_timestamp ON medical_reports;
CREATE TRIGGER trg_update_medical_reports_timestamp
BEFORE UPDATE ON medical_reports
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.6 - Laboratory Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 19. LAB TESTS CATALOG TABLE
-- Standard diagnostic tests offered by hospital laboratory with pricing and turnaround times.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_tests (
    id BIGSERIAL PRIMARY KEY,
    test_code VARCHAR(30) NOT NULL UNIQUE,
    test_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('HEMATOLOGY', 'BIOCHEMISTRY', 'IMMUNOLOGY', 'MICROBIOLOGY', 'PATHOLOGY', 'URINALYSIS', 'RADIOLOGY', 'OTHER')
    ),
    sample_type VARCHAR(50) NOT NULL CHECK (
        sample_type IN ('BLOOD', 'SERUM', 'PLASMA', 'URINE', 'STOOL', 'SWAB', 'SPUTUM', 'CSF', 'TISSUE', 'OTHER')
    ),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    turnaround_time_hours INT NOT NULL DEFAULT 24,
    reference_range VARCHAR(150),
    unit VARCHAR(50),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 20. LAB REQUESTS TABLE
-- Diagnostic test requests ordered by physicians for inpatients or outpatients.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_requests (
    id BIGSERIAL PRIMARY KEY,
    request_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
    medical_record_id BIGINT REFERENCES medical_records(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE' CHECK (
        priority IN ('ROUTINE', 'URGENT', 'STAT')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED' CHECK (
        status IN ('REQUESTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    clinical_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 21. LAB REQUEST ITEMS TABLE
-- Individual laboratory tests included within a diagnostic request.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_request_items (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
    lab_test_id BIGINT NOT NULL REFERENCES lab_tests(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 22. LAB SAMPLES TABLE
-- Physical specimen collection, barcoding, and tracking records.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_samples (
    id BIGSERIAL PRIMARY KEY,
    sample_barcode VARCHAR(50) NOT NULL UNIQUE,
    request_id BIGINT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
    sample_type VARCHAR(50) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    collected_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    collection_site VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'COLLECTED' CHECK (
        status IN ('COLLECTED', 'RECEIVED_IN_LAB', 'PROCESSING', 'REJECTED', 'DISPOSED')
    ),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 23. LAB RESULTS TABLE
-- Quantitative and qualitative laboratory measurement values and findings.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_results (
    id BIGSERIAL PRIMARY KEY,
    request_item_id BIGINT NOT NULL REFERENCES lab_request_items(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    result_value VARCHAR(100) NOT NULL,
    reference_range VARCHAR(100),
    unit VARCHAR(50),
    flag VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (
        flag IN ('NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'ABNORMAL')
    ),
    notes TEXT,
    entered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 24. LAB REPORTS TABLE
-- Verified and finalized clinical diagnostic laboratory reports.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_reports (
    id BIGSERIAL PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL UNIQUE,
    request_id BIGINT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
    generated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    report_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    summary TEXT,
    comments TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PRELIMINARY' CHECK (
        status IN ('PRELIMINARY', 'FINALIZED', 'AMENDED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.6 (LABORATORY MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_requests_number ON lab_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_doctor ON lab_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_priority ON lab_requests(priority);
CREATE INDEX IF NOT EXISTS idx_lab_request_items_req ON lab_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_barcode ON lab_samples(sample_barcode);
CREATE INDEX IF NOT EXISTS idx_lab_samples_request ON lab_samples(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_item ON lab_results(request_item_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_number ON lab_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_lab_reports_request ON lab_reports(request_id);

DROP TRIGGER IF EXISTS trg_update_lab_tests_timestamp ON lab_tests;
CREATE TRIGGER trg_update_lab_tests_timestamp
BEFORE UPDATE ON lab_tests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_lab_requests_timestamp ON lab_requests;
CREATE TRIGGER trg_update_lab_requests_timestamp
BEFORE UPDATE ON lab_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_lab_request_items_timestamp ON lab_request_items;
CREATE TRIGGER trg_update_lab_request_items_timestamp
BEFORE UPDATE ON lab_request_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_lab_samples_timestamp ON lab_samples;
CREATE TRIGGER trg_update_lab_samples_timestamp
BEFORE UPDATE ON lab_samples
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_lab_results_timestamp ON lab_results;
CREATE TRIGGER trg_update_lab_results_timestamp
BEFORE UPDATE ON lab_results
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_lab_reports_timestamp ON lab_reports;
CREATE TRIGGER trg_update_lab_reports_timestamp
BEFORE UPDATE ON lab_reports
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.7 - Pharmacy Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 25. MEDICINES TABLE (INVENTORY & DRUG CATALOG)
-- Core formulary and medicine master maintaining drug specifications, classifications,
-- pricing, and minimum stock threshold levels.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    id BIGSERIAL PRIMARY KEY,
    medicine_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150),
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'ANALGESIC',
            'ANTIBIOTIC',
            'ANTIHYPERTENSIVE',
            'ANTIDIABETIC',
            'ANTIHISTAMINE',
            'ANTIPYRETIC',
            'GASTROINTESTINAL',
            'CARDIOVASCULAR',
            'RESPIRATORY',
            'DERMATOLOGICAL',
            'VITAMINS_SUPPLEMENTS',
            'OTHER'
        )
    ),
    dosage_form VARCHAR(50) NOT NULL CHECK (
        dosage_form IN (
            'TABLET',
            'CAPSULE',
            'SYRUP',
            'INJECTION',
            'SUSPENSION',
            'OINTMENT',
            'DROPS',
            'INHALER',
            'SUPPOSITORY',
            'OTHER'
        )
    ),
    strength VARCHAR(50) NOT NULL,
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'TABLET' CHECK (
        unit_of_measure IN ('TABLET', 'CAPSULE', 'BOTTLE', 'STRIP', 'VIAL', 'AMPOULE', 'TUBE', 'BOX', 'PIECE')
    ),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_level INT NOT NULL DEFAULT 50,
    manufacturer VARCHAR(150),
    storage_conditions VARCHAR(150) DEFAULT 'Store below 25°C in a dry place',
    description TEXT,
    side_effects TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 26. MEDICINE BATCHES TABLE (STOCK & EXPIRY TRACKING)
-- Tracks specific procurement lots, supplier information, purchase costs,
-- manufacturing/expiration dates, and remaining physical stock for FEFO management.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicine_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(50) NOT NULL,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
    current_quantity INT NOT NULL CHECK (current_quantity >= 0),
    unit_purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    supplier_name VARCHAR(150),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'EXPIRED', 'DEPLETED', 'RECALLED')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

-- ------------------------------------------------------------------------------
-- 27. PHARMACY DISPENSATIONS TABLE (PRESCRIPTION FULFILLMENT & OTC SALES)
-- Header records documenting prescription-based or direct over-the-counter dispensing,
-- pharmacist accountability, and financial totals.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_dispensations (
    id BIGSERIAL PRIMARY KEY,
    dispensation_number VARCHAR(30) NOT NULL UNIQUE,
    prescription_id BIGINT REFERENCES prescriptions(id) ON DELETE SET NULL,
    patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    doctor_name VARCHAR(150),
    dispensed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID' CHECK (
        payment_status IN ('PAID', 'PENDING', 'WAIVED')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (
        status IN ('COMPLETED', 'CANCELLED', 'REFUNDED')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 28. PHARMACY DISPENSATION ITEMS TABLE
-- Line items of medications issued under a dispensation, mapped to the specific batch.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_dispensation_items (
    id BIGSERIAL PRIMARY KEY,
    dispensation_id BIGINT NOT NULL REFERENCES pharmacy_dispensations(id) ON DELETE CASCADE,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id BIGINT REFERENCES medicine_batches(id) ON DELETE SET NULL,
    prescription_item_id BIGINT REFERENCES prescription_items(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    dosage_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 29. PHARMACY STOCK TRANSACTIONS TABLE
-- Complete inventory ledger logging every quantity change, adjustment, and disposal.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES medicine_batches(id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('PURCHASE_RECEIPT', 'DISPENSE', 'RETURN', 'STOCK_ADJUSTMENT', 'DISPOSAL_EXPIRED')
    ),
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.7 (PHARMACY MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_medicines_code ON medicines(medicine_code);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(is_active);

CREATE INDEX IF NOT EXISTS idx_medicine_batches_medicine ON medicine_batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_batches_batch_num ON medicine_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_medicine_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicine_batches_status ON medicine_batches(status);

CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensations_number ON pharmacy_dispensations(dispensation_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensations_presc ON pharmacy_dispensations(prescription_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensations_patient ON pharmacy_dispensations(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensations_date ON pharmacy_dispensations(dispensed_at);

CREATE INDEX IF NOT EXISTS idx_dispensation_items_disp ON pharmacy_dispensation_items(dispensation_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_items_med ON pharmacy_dispensation_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_items_batch ON pharmacy_dispensation_items(batch_id);

CREATE INDEX IF NOT EXISTS idx_stock_tx_med ON pharmacy_stock_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_batch ON pharmacy_stock_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_date ON pharmacy_stock_transactions(created_at);

DROP TRIGGER IF EXISTS trg_update_medicines_timestamp ON medicines;
CREATE TRIGGER trg_update_medicines_timestamp
BEFORE UPDATE ON medicines
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_medicine_batches_timestamp ON medicine_batches;
CREATE TRIGGER trg_update_medicine_batches_timestamp
BEFORE UPDATE ON medicine_batches
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_pharmacy_dispensations_timestamp ON pharmacy_dispensations;
CREATE TRIGGER trg_update_pharmacy_dispensations_timestamp
BEFORE UPDATE ON pharmacy_dispensations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.8 - Billing System (Admissions, Invoices, Charges & Payments)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 30. ADMISSIONS TABLE (INPATIENT STAYS & WARD/BED CHARGES)
-- Tracks inpatient admissions, ward/room allocation, daily room & nursing tariffs,
-- length of stay, and discharge details for admission charge calculation.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admissions (
    id BIGSERIAL PRIMARY KEY,
    admission_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    attending_doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    ward_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) NOT NULL CHECK (
        room_type IN (
            'GENERAL_WARD',
            'SEMI_PRIVATE',
            'PRIVATE_ROOM',
            'DELUXE_SUITE',
            'ICU',
            'NICU',
            'EMERGENCY_OBSERVATION'
        )
    ),
    bed_number VARCHAR(30) NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMPTZ,
    daily_room_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    nursing_fee_per_day NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    admission_reason TEXT,
    discharge_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ADMITTED' CHECK (
        status IN ('ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'CANCELLED')
    ),
    admitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 31. BILLING INVOICES TABLE (INVOICE GENERATION & FINANCIAL HEADERS)
-- Central billing invoice header consolidating consultation, laboratory,
-- pharmacy, and admission charges with tax, discounts, and payment balance.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    admission_id BIGINT REFERENCES admissions(id) ON DELETE SET NULL,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (
        status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED')
    ),
    notes TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 32. BILLING INVOICE ITEMS TABLE (CONSULTATION, LAB, PHARMACY & ADMISSION CHARGES)
-- Line items breaking down charges by category with source reference links.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
    charge_type VARCHAR(30) NOT NULL CHECK (
        charge_type IN ('CONSULTATION', 'LABORATORY', 'PHARMACY', 'ADMISSION', 'PROCEDURE', 'OTHER')
    ),
    reference_type VARCHAR(50),
    reference_id BIGINT,
    reference_code VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    service_date DATE DEFAULT CURRENT_DATE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 33. BILLING PAYMENTS TABLE (PAYMENT RECORDING & RECEIPTS)
-- Records full or installment payments against invoices across multiple payment modes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    invoice_id BIGINT NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (
        payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE', 'CHEQUE')
    ),
    transaction_reference VARCHAR(100),
    payer_name VARCHAR(150),
    insurance_provider VARCHAR(150),
    insurance_policy_number VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (
        status IN ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED')
    ),
    received_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.8 (BILLING & ADMISSIONS)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admissions_number ON admissions(admission_number);
CREATE INDEX IF NOT EXISTS idx_admissions_patient ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_doctor ON admissions(attending_doctor_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_date ON admissions(admission_date);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_number ON billing_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_patient ON billing_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_issue_date ON billing_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date ON billing_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_billing_items_invoice ON billing_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_charge_type ON billing_invoice_items(charge_type);
CREATE INDEX IF NOT EXISTS idx_billing_items_ref_code ON billing_invoice_items(reference_code);

CREATE INDEX IF NOT EXISTS idx_billing_payments_number ON billing_payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_billing_payments_invoice ON billing_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_patient ON billing_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_method ON billing_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_billing_payments_date ON billing_payments(payment_date);

DROP TRIGGER IF EXISTS trg_update_admissions_timestamp ON admissions;
CREATE TRIGGER trg_update_admissions_timestamp
BEFORE UPDATE ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_billing_invoices_timestamp ON billing_invoices;
CREATE TRIGGER trg_update_billing_invoices_timestamp
BEFORE UPDATE ON billing_invoices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_billing_payments_timestamp ON billing_payments;
CREATE TRIGGER trg_update_billing_payments_timestamp
BEFORE UPDATE ON billing_payments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.9 - Staff Management (Employees, Attendance, Department Assignment & Leave Records)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 34. STAFF EMPLOYEES TABLE (EMPLOYEE REGISTRATION & PROFILES)
-- Central human resources registry for nurses, lab technologists, pharmacists,
-- receptionists, accountants, doctors, and administrative/support personnel.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_employees (
    id BIGSERIAL PRIMARY KEY,
    employee_number VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic_or_passport VARCHAR(50) NOT NULL UNIQUE,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    date_of_birth DATE,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    role_category VARCHAR(40) NOT NULL CHECK (
        role_category IN (
            'DOCTOR',
            'NURSE',
            'RECEPTIONIST',
            'LABORATORY_STAFF',
            'PHARMACIST',
            'ACCOUNTANT',
            'ADMINISTRATIVE',
            'SUPPORT_STAFF'
        )
    ),
    designation VARCHAR(100) NOT NULL,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME' CHECK (
        employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING', 'INTERN')
    ),
    shift_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR_DAY' CHECK (
        shift_type IN ('MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL', 'REGULAR_DAY')
    ),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    qualification VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED')
    ),
    annual_leave_quota INT NOT NULL DEFAULT 14,
    casual_leave_quota INT NOT NULL DEFAULT 7,
    sick_leave_quota INT NOT NULL DEFAULT 7,
    notes TEXT,
    registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 35. STAFF ATTENDANCE TABLE (DAILY ATTENDANCE & SHIFT CHECK-IN / CHECK-OUT)
-- Tracks daily attendance status, check-in/out times, worked hours, and overtime.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES staff_employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME,
    check_out_time TIME,
    shift_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR_DAY' CHECK (
        shift_type IN ('MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL', 'REGULAR_DAY')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'PRESENT' CHECK (
        status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'HOLIDAY')
    ),
    working_hours NUMERIC(5, 2) DEFAULT 0.00,
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    remarks TEXT,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- ------------------------------------------------------------------------------
-- 36. STAFF DEPARTMENT ASSIGNMENTS TABLE (DEPARTMENT TRANSFERS & ROLE HISTORY)
-- Tracks initial department placements, inter-departmental transfers, promotions,
-- and shift reassignments with effective dates and authorization audit.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_department_assignments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES staff_employees(id) ON DELETE CASCADE,
    from_department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    to_department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    previous_designation VARCHAR(100),
    new_designation VARCHAR(100) NOT NULL,
    previous_shift VARCHAR(30),
    new_shift VARCHAR(30) NOT NULL,
    assignment_type VARCHAR(30) NOT NULL DEFAULT 'TRANSFER' CHECK (
        assignment_type IN ('INITIAL_ASSIGNMENT', 'TRANSFER', 'PROMOTION', 'TEMPORARY_ROTATION', 'REASSIGNMENT')
    ),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 37. STAFF LEAVE RECORDS TABLE (LEAVE REQUESTS, APPROVALS & QUOTA TRACKING)
-- Manages employee leave applications, handover notes, and supervisor approvals.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_leave_records (
    id BIGSERIAL PRIMARY KEY,
    leave_number VARCHAR(30) NOT NULL UNIQUE,
    employee_id BIGINT NOT NULL REFERENCES staff_employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL CHECK (
        leave_type IN ('ANNUAL', 'CASUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'STUDY', 'EMERGENCY')
    ),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    handover_notes TEXT,
    emergency_contact VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    ),
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    requested_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.9 (STAFF MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_staff_employees_number ON staff_employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_staff_employees_dept ON staff_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_employees_role ON staff_employees(role_category);
CREATE INDEX IF NOT EXISTS idx_staff_employees_status ON staff_employees(status);
CREATE INDEX IF NOT EXISTS idx_staff_employees_nic ON staff_employees(nic_or_passport);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_emp ON staff_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_status ON staff_attendance(status);

CREATE INDEX IF NOT EXISTS idx_staff_dept_assign_emp ON staff_department_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept_assign_to_dept ON staff_department_assignments(to_department_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept_assign_date ON staff_department_assignments(effective_date);

CREATE INDEX IF NOT EXISTS idx_staff_leave_number ON staff_leave_records(leave_number);
CREATE INDEX IF NOT EXISTS idx_staff_leave_emp ON staff_leave_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_status ON staff_leave_records(status);
CREATE INDEX IF NOT EXISTS idx_staff_leave_dates ON staff_leave_records(start_date, end_date);

DROP TRIGGER IF EXISTS trg_update_staff_employees_timestamp ON staff_employees;
CREATE TRIGGER trg_update_staff_employees_timestamp
BEFORE UPDATE ON staff_employees
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_staff_attendance_timestamp ON staff_attendance;
CREATE TRIGGER trg_update_staff_attendance_timestamp
BEFORE UPDATE ON staff_attendance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_staff_leave_records_timestamp ON staff_leave_records;
CREATE TRIGGER trg_update_staff_leave_records_timestamp
BEFORE UPDATE ON staff_leave_records
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- Module 3.10 - Hospital Reports & Analytics
-- (Patient, Appointment, Revenue, Pharmacy, Laboratory & Staff Reports)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 38. HOSPITAL REPORTS TABLE (GENERATED & SAVED ANALYTICAL REPORTS REGISTRY)
-- Stores generated analytical report snapshots across all 6 Module 3.10 pillars:
-- Patient, Appointment, Revenue, Pharmacy, Laboratory, and Staff Reports.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_reports (
    id BIGSERIAL PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL UNIQUE,
    report_title VARCHAR(200) NOT NULL,
    report_category VARCHAR(40) NOT NULL CHECK (
        report_category IN (
            'PATIENT_REPORT',
            'APPOINTMENT_REPORT',
            'REVENUE_REPORT',
            'PHARMACY_REPORT',
            'LABORATORY_REPORT',
            'STAFF_REPORT'
        )
    ),
    period_start DATE,
    period_end DATE,
    department_name VARCHAR(100) DEFAULT 'All Hospital Departments',
    total_records_analyzed BIGINT NOT NULL DEFAULT 0,
    primary_metric_label VARCHAR(100),
    primary_metric_value VARCHAR(100),
    executive_summary TEXT NOT NULL,
    key_findings TEXT,
    recommendations TEXT,
    report_payload_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'FINALIZED' CHECK (
        status IN ('DRAFT', 'FINALIZED', 'ARCHIVED')
    ),
    generated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES & TRIGGERS FOR MODULE 3.10 (HOSPITAL REPORTS)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_hospital_reports_number ON hospital_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_hospital_reports_category ON hospital_reports(report_category);
CREATE INDEX IF NOT EXISTS idx_hospital_reports_status ON hospital_reports(status);
CREATE INDEX IF NOT EXISTS idx_hospital_reports_generated_at ON hospital_reports(generated_at);

DROP TRIGGER IF EXISTS trg_update_hospital_reports_timestamp ON hospital_reports;
CREATE TRIGGER trg_update_hospital_reports_timestamp
BEFORE UPDATE ON hospital_reports
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();
