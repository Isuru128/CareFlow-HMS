-- ==============================================================================
-- CareFlow Hospital Management System (HMS)
-- Database Schema: Module 3.1 - User Management & RBAC
-- Target Database: PostgreSQL (Supabase Compatible)
-- ==============================================================================

-- Enable UUID extension if required for future modules
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- INDEXES FOR QUERY OPTIMIZATION
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

-- ------------------------------------------------------------------------------
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_users_timestamp ON users;
CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- ------------------------------------------------------------------------------
-- SEED DATA: Default Administrator (Credentials: admin / Admin@123)
-- ------------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, status)
VALUES (
    'admin',
    'admin@careflow.lk',
    '$2a$10$LE7k63jl5YklWQ7Xfw7X6.zxPImenU.SrTO.YfYcw7SRy.3lmh.We',
    'System',
    'Administrator',
    '+94770000000',
    'ACTIVE'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT u.id, 'ROLE_ADMIN'
FROM users u
WHERE u.username = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

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
-- INDEXES FOR PATIENT MANAGEMENT
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

-- ------------------------------------------------------------------------------
-- TRIGGERS FOR PATIENTS & MEDICAL HISTORY TIMESTAMP UPDATE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- SEED DATA: Sample Patient
-- ------------------------------------------------------------------------------
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, gender, blood_group, contact_number, email, nic_or_passport, address, emergency_contact_name, emergency_contact_number, emergency_contact_relation, allergies, status)
VALUES (
    'PAT-10001',
    'John',
    'Doe',
    '1985-05-15',
    'MALE',
    'O+',
    '+94711234567',
    'johndoe@example.com',
    '198512345678',
    '123 Galle Road, Colombo 03, Sri Lanka',
    'Jane Doe',
    '+94719876543',
    'Spouse',
    'Penicillin',
    'ACTIVE'
)
ON CONFLICT (patient_number) DO NOTHING;

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
-- INDEXES FOR DOCTOR & APPOINTMENT MANAGEMENT
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

-- ------------------------------------------------------------------------------
-- TRIGGERS FOR DOCTOR & APPOINTMENT TIMESTAMPS
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- SEED DATA: Departments, Doctors, Schedules & Sample Appointments
-- ------------------------------------------------------------------------------
INSERT INTO departments (name, code, description, contact_number, is_active)
VALUES
    ('Cardiology', 'CARD', 'Comprehensive cardiovascular medicine and care', '+94112345001', TRUE),
    ('Pediatrics', 'PED', 'Child health and infant medical treatment', '+94112345002', TRUE),
    ('General Medicine', 'GEN', 'General healthcare, diagnoses, and inpatient care', '+94112345003', TRUE),
    ('Orthopedics', 'ORTHO', 'Musculoskeletal system, spine, joints, and fractures', '+94112345004', TRUE),
    ('Neurology', 'NEUR', 'Brain, spinal cord, and nervous system disorders', '+94112345005', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO doctors (doctor_number, first_name, last_name, specialization, license_number, department_id, qualification, experience_years, contact_number, email, consultation_fee, room_number, bio, status)
SELECT
    'DOC-10001',
    'Kumara',
    'Perera',
    'Cardiologist',
    'SLMC-12345',
    d.id,
    'MBBS, MD (Cardiology), FRCP',
    15,
    '+94771234567',
    'kumara.perera@careflow.lk',
    3500.00,
    'Room 102',
    'Senior Consultant Cardiologist specializing in preventive and interventional cardiology.',
    'ACTIVE'
FROM departments d
WHERE d.code = 'CARD'
ON CONFLICT (doctor_number) DO NOTHING;

INSERT INTO doctors (doctor_number, first_name, last_name, specialization, license_number, department_id, qualification, experience_years, contact_number, email, consultation_fee, room_number, bio, status)
SELECT
    'DOC-10002',
    'Anoma',
    'Senanayake',
    'Pediatrician',
    'SLMC-23456',
    d.id,
    'MBBS, DCH, MD (Pediatrics)',
    12,
    '+94772345678',
    'anoma.senanayake@careflow.lk',
    2800.00,
    'Room 205',
    'Consultant Pediatrician with over a decade of clinical care experience in child wellness.',
    'ACTIVE'
FROM departments d
WHERE d.code = 'PED'
ON CONFLICT (doctor_number) DO NOTHING;

INSERT INTO doctors (doctor_number, first_name, last_name, specialization, license_number, department_id, qualification, experience_years, contact_number, email, consultation_fee, room_number, bio, status)
SELECT
    'DOC-10003',
    'Rohan',
    'Wickramasinghe',
    'General Physician',
    'SLMC-34567',
    d.id,
    'MBBS, MD (General Medicine)',
    18,
    '+94773456789',
    'rohan.wick@careflow.lk',
    2500.00,
    'Room 108',
    'Senior General Physician experienced in chronic illness management and adult medicine.',
    'ACTIVE'
FROM departments d
WHERE d.code = 'GEN'
ON CONFLICT (doctor_number) DO NOTHING;

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients, slot_duration_minutes, room_number, is_active)
SELECT doc.id, 'MONDAY', '09:00:00', '12:00:00', 15, 15, 'Room 102', TRUE
FROM doctors doc WHERE doc.doctor_number = 'DOC-10001'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients, slot_duration_minutes, room_number, is_active)
SELECT doc.id, 'WEDNESDAY', '09:00:00', '12:00:00', 15, 15, 'Room 102', TRUE
FROM doctors doc WHERE doc.doctor_number = 'DOC-10001'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients, slot_duration_minutes, room_number, is_active)
SELECT doc.id, 'TUESDAY', '14:00:00', '17:00:00', 20, 15, 'Room 205', TRUE
FROM doctors doc WHERE doc.doctor_number = 'DOC-10002'
ON CONFLICT DO NOTHING;

INSERT INTO appointments (appointment_number, patient_id, doctor_id, department_id, appointment_date, appointment_time, queue_number, appointment_type, status, reason, notes, consultation_fee)
SELECT
    'APT-10001',
    p.id,
    d.id,
    d.department_id,
    CURRENT_DATE + INTERVAL '1 day',
    '09:30:00',
    1,
    'CONSULTATION',
    'SCHEDULED',
    'Routine cardiology follow-up and blood pressure assessment',
    'Initial follow-up requested by patient',
    d.consultation_fee
FROM patients p, doctors d

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
-- INDEXES FOR ELECTRONIC MEDICAL RECORDS (EMR)
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

-- ------------------------------------------------------------------------------
-- TRIGGERS FOR EMR TIMESTAMPS
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- SEED DATA: Medical Records, Diagnoses, Prescriptions, Treatments & Reports
-- ------------------------------------------------------------------------------
INSERT INTO medical_records (
    record_number, patient_id, doctor_id, appointment_id, visit_date,
    chief_complaint, examination_notes, clinical_notes,
    blood_pressure, temperature_celsius, heart_rate_bpm, respiratory_rate_bpm, weight_kg, height_cm, bmi, oxygen_saturation, status
)
SELECT
    'EMR-10001',
    p.id,
    d.id,
    a.id,
    CURRENT_TIMESTAMP,
    'Mild chest tightness on exertion and occasional dizziness over past 2 weeks.',
    'S1 S2 normal, no murmurs. Lungs clear to auscultation bilaterally. No pedal edema.',
    'Stage 1 Hypertension confirmed with mild exertion angina symptoms. ECG recommended.',
    '138/88',
    36.7,
    76,
    16,
    78.00,
    175.00,
    25.5,
    98,
    'FINALIZED'
FROM patients p, doctors d
LEFT JOIN appointments a ON a.appointment_number = 'APT-10001'
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001'
ON CONFLICT (record_number) DO NOTHING;

INSERT INTO patient_diagnoses (
    medical_record_id, patient_id, doctor_id, icd10_code, diagnosis_name, diagnosis_type, status, severity, diagnosed_date, notes
)
SELECT
    mr.id,
    mr.patient_id,
    mr.doctor_id,
    'I10',
    'Essential (primary) hypertension',
    'PRIMARY',
    'ACTIVE',
    'MODERATE',
    CURRENT_DATE,
    'Patient instructed on dietary sodium restriction and daily blood pressure monitoring.'
FROM medical_records mr
WHERE mr.record_number = 'EMR-10001'
ON CONFLICT DO NOTHING;

INSERT INTO prescriptions (
    prescription_number, medical_record_id, patient_id, doctor_id, issue_date, valid_until, status, instructions, notes
)
SELECT
    'RX-10001',
    mr.id,
    mr.patient_id,
    mr.doctor_id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'ACTIVE',
    'Take medications regularly as directed. Return for follow-up in 4 weeks.',
    'Monitor blood pressure each morning.'
FROM medical_records mr
WHERE mr.record_number = 'EMR-10001'
ON CONFLICT (prescription_number) DO NOTHING;

INSERT INTO prescription_items (
    prescription_id, medication_name, dosage, frequency, route, duration, quantity, instructions, is_dispensed
)
SELECT
    rx.id,
    'Amlodipine 5mg Tablet',
    '5 mg',
    'Once Daily (Morning)',
    'ORAL',
    '30 Days',
    30,
    'Take 1 tablet every morning with or without food',
    FALSE
FROM prescriptions rx
WHERE rx.prescription_number = 'RX-10001'
ON CONFLICT DO NOTHING;

INSERT INTO prescription_items (
    prescription_id, medication_name, dosage, frequency, route, duration, quantity, instructions, is_dispensed
)
SELECT
    rx.id,
    'Aspirin 75mg Tablet',
    '75 mg',
    'Once Daily (Night)',
    'ORAL',
    '30 Days',
    30,
    'Take 1 tablet after dinner with a full glass of water',
    FALSE
FROM prescriptions rx
WHERE rx.prescription_number = 'RX-10001'
ON CONFLICT DO NOTHING;

INSERT INTO treatment_histories (
    patient_id, medical_record_id, doctor_id, treatment_name, category, start_date, end_date, status, outcome, procedure_notes, complications
)
SELECT
    p.id,
    mr.id,
    d.id,
    'Antihypertensive Pharmacotherapy & Lifestyle Counseling',
    'MEDICATION_THERAPY',
    CURRENT_DATE,
    NULL,
    'IN_PROGRESS',
    'IMPROVED',
    'Initiated calcium channel blocker therapy (Amlodipine 5mg). Prescribed DASH diet and 30 min daily walking.',
    'None reported'
FROM patients p, doctors d, medical_records mr
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001' AND mr.record_number = 'EMR-10001'
ON CONFLICT DO NOTHING;

INSERT INTO medical_reports (
    report_number, medical_record_id, patient_id, doctor_id, report_title, report_type, report_date, clinical_findings, recommendations, summary, status
)
SELECT
    'REP-10001',
    mr.id,
    p.id,
    d.id,
    'Cardiovascular Clinical Consultation Report',
    'CONSULTATION_NOTE',
    CURRENT_DATE,
    'Patient presented with mild chest tightness and elevated blood pressure (138/88 mmHg). Cardiovascular examination revealed normal heart sounds S1 S2, no murmurs. ECG demonstrated normal sinus rhythm without ischemic changes.',
    '1. Amlodipine 5mg once daily\n2. Low sodium diet\n3. Repeat ECG and lipid profile in 1 month\n4. Follow-up clinic review in 4 weeks',
    'Essential hypertension well-tolerated on initial presentation. Commenced pharmacotherapy with positive prognosis.',
    'FINALIZED'
FROM patients p, doctors d, medical_records mr
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001' AND mr.record_number = 'EMR-10001'
ON CONFLICT (report_number) DO NOTHING;

-- ==============================================================================
-- Module 3.6 - Laboratory Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 18. LAB TESTS CATALOG TABLE
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
-- 19. LAB REQUESTS TABLE
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
-- 20. LAB REQUEST ITEMS TABLE
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
-- 21. LAB SAMPLES TABLE
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
-- 22. LAB RESULTS TABLE
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
-- 23. LAB REPORTS TABLE
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
-- INDEXES FOR LABORATORY MODULE
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

-- ------------------------------------------------------------------------------
-- SEED DATA: LABORATORY CATALOG, TEST REQUEST, SAMPLE, RESULTS & REPORT
-- ------------------------------------------------------------------------------
INSERT INTO lab_tests (test_code, test_name, category, sample_type, price, turnaround_time_hours, reference_range, unit, description, is_active)
VALUES
('LAB-CBC', 'Complete Blood Count (CBC)', 'HEMATOLOGY', 'BLOOD', 1500.00, 4, 'Varies by parameter', NULL, 'Comprehensive evaluation of RBC, WBC, Hemoglobin, Hematocrit and Platelet indices', TRUE),
('LAB-FBS', 'Fasting Blood Sugar (FBS)', 'BIOCHEMISTRY', 'BLOOD', 500.00, 2, '70.0 - 99.0', 'mg/dL', 'Measures blood glucose concentration following minimum 8-hour fasting period', TRUE),
('LAB-LIPID', 'Lipid Profile', 'BIOCHEMISTRY', 'BLOOD', 2200.00, 6, 'Cholesterol < 200, Triglycerides < 150', 'mg/dL', 'Serum lipids including Total Cholesterol, HDL, LDL, VLDL, and Triglycerides', TRUE),
('LAB-LFT', 'Liver Function Test (LFT)', 'BIOCHEMISTRY', 'SERUM', 2500.00, 6, 'SGOT 15-40, SGPT 10-49, Bilirubin 0.2-1.2', 'U/L', 'Enzymatic screen of hepatic parenchymal integrity and biliary excretory capacity', TRUE),
('LAB-CREAT', 'Serum Creatinine & eGFR', 'BIOCHEMISTRY', 'SERUM', 800.00, 3, '0.7 - 1.3', 'mg/dL', 'Renal clearance and glomerular filtration capacity biomarker', TRUE),
('LAB-HBA1C', 'Glycated Hemoglobin (HbA1c)', 'HEMATOLOGY', 'BLOOD', 1800.00, 6, '4.0 - 5.6', '%', 'Long-term glycemic control evaluation reflecting average 3-month blood sugar', TRUE),
('LAB-URINE', 'Urinalysis (Full Routine)', 'URINALYSIS', 'URINE', 600.00, 2, 'Yellow, Clear, pH 5.0-8.0, SG 1.005-1.030', NULL, 'Physical, chemical, and microscopic sediment analysis of clean catch urine', TRUE),
('LAB-TSH', 'Thyroid Stimulating Hormone (TSH)', 'IMMUNOLOGY', 'SERUM', 1600.00, 8, '0.40 - 4.50', 'uIU/mL', 'Hypothalamic-pituitary-thyroid axis biomarker for hypothyroidism or hyperthyroidism', TRUE),
('LAB-CRP', 'C-Reactive Protein (Quantitative)', 'IMMUNOLOGY', 'SERUM', 1200.00, 4, '< 5.0', 'mg/L', 'Acute-phase reactant marker indicating systemic inflammatory and infectious states', TRUE),
('LAB-COVID', 'SARS-CoV-2 Antigen Rapid Test', 'MICROBIOLOGY', 'SWAB', 1200.00, 1, 'Negative', NULL, 'Rapid qualitative immunochromatographic assay for viral nucleocapsid antigen', TRUE)
ON CONFLICT (test_code) DO NOTHING;

-- Seed Sample Request for PAT-10001
INSERT INTO lab_requests (
    request_number, patient_id, doctor_id, priority, status, clinical_notes, requested_at
)
SELECT
    'LRQ-10001',
    p.id,
    d.id,
    'URGENT',
    'COMPLETED',
    'Patient with stage 1 hypertension and mild chest tightness. Routine baseline hematology and fasting lipid assessment requested.',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM patients p, doctors d
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001'
ON CONFLICT (request_number) DO NOTHING;

-- Seed Sample Request Items
INSERT INTO lab_request_items (request_id, lab_test_id, status, notes)
SELECT
    lr.id,
    lt.id,
    'COMPLETED',
    'Priority processing requested by cardiologist'
FROM lab_requests lr, lab_tests lt
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code IN ('LAB-CBC', 'LAB-LIPID')
ON CONFLICT DO NOTHING;

-- Seed Sample Collection
INSERT INTO lab_samples (sample_barcode, request_id, sample_type, collected_at, collection_site, status, notes)
SELECT
    'SMP-20261026-0001',
    lr.id,
    'BLOOD',
    CURRENT_TIMESTAMP - INTERVAL '20 hours',
    'Left antecubital fossa',
    'RECEIVED_IN_LAB',
    'Collected in EDTA tube and SST Gel tube without hemolysis'
FROM lab_requests lr
WHERE lr.request_number = 'LRQ-10001'
ON CONFLICT (sample_barcode) DO NOTHING;

-- Seed Result Parameters for CBC
INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'Hemoglobin',
    '14.5',
    '13.0 - 17.0',
    'g/dL',
    'NORMAL',
    'Optimal oxygen carrying capacity'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-CBC'
ON CONFLICT DO NOTHING;

INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'White Blood Cells (WBC)',
    '7,200',
    '4,500 - 11,000',
    '/uL',
    'NORMAL',
    'Normal total leukocyte count'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-CBC'
ON CONFLICT DO NOTHING;

INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'Platelets',
    '265,000',
    '150,000 - 450,000',
    '/uL',
    'NORMAL',
    'Platelet aggregation normal'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-CBC'
ON CONFLICT DO NOTHING;

-- Seed Result Parameters for Lipid Profile
INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'Total Cholesterol',
    '228.0',
    '< 200.0',
    'mg/dL',
    'HIGH',
    'Borderline elevated total cholesterol'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-LIPID'
ON CONFLICT DO NOTHING;

INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'Triglycerides',
    '175.0',
    '< 150.0',
    'mg/dL',
    'HIGH',
    'Mild hypertriglyceridemia'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-LIPID'
ON CONFLICT DO NOTHING;

INSERT INTO lab_results (request_item_id, parameter_name, result_value, reference_range, unit, flag, notes)
SELECT
    lri.id,
    'HDL Cholesterol',
    '44.0',
    '> 40.0',
    'mg/dL',
    'NORMAL',
    'Adequate protective high-density lipoprotein level'
FROM lab_request_items lri
JOIN lab_requests lr ON lri.request_id = lr.id
JOIN lab_tests lt ON lri.lab_test_id = lt.id
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code = 'LAB-LIPID'
ON CONFLICT DO NOTHING;

-- Seed Finalized Diagnostic Report
INSERT INTO lab_reports (
    report_number, request_id, report_date, summary, comments, status
)
SELECT
    'LRPT-10001',
    lr.id,
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    'Hematology profile unremarkable with normal hemoglobin and leukocyte levels. Lipid panel demonstrates moderate hypercholesterolemia and mild hypertriglyceridemia.',
    'Correlate with cardiovascular risk assessment. Dietary lipid moderation and follow-up lipid screening advised in 8 weeks.',
    'FINALIZED'
FROM lab_requests lr
WHERE lr.request_number = 'LRQ-10001'
ON CONFLICT (report_number) DO NOTHING;




