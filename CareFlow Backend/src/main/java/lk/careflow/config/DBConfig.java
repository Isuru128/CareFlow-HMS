package lk.careflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@Configuration
public class DBConfig {

    private static final Logger logger = LoggerFactory.getLogger(DBConfig.class);

    @Bean
    public CommandLineRunner databaseConnectionCheck(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                String databaseName = metaData.getDatabaseProductName();
                String databaseVersion = metaData.getDatabaseProductVersion();

                String banner = """
                        
                        ==================================================================
                         PostgreSQL (Supabase) Database Connected Successfully!
                         Database: %s
                         Version : %s
                        ==================================================================
                        """.formatted(databaseName, databaseVersion);

                logger.info(banner);
                ensureBillingTablesExist(connection);
                ensureStaffTablesExist(connection);
            } catch (Exception e) {
                logger.error("Failed to connect to PostgreSQL (Supabase) Database: {}", e.getMessage(), e);
            }
        };
    }

    private void ensureBillingTablesExist(Connection connection) {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS admissions (
                    id BIGSERIAL PRIMARY KEY,
                    admission_number VARCHAR(30) NOT NULL UNIQUE,
                    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                    attending_doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
                    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
                    ward_name VARCHAR(100) NOT NULL,
                    room_type VARCHAR(50) NOT NULL CHECK (
                        room_type IN ('GENERAL_WARD', 'SEMI_PRIVATE', 'PRIVATE_ROOM', 'DELUXE_SUITE', 'ICU', 'NICU', 'EMERGENCY_OBSERVATION')
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
                """);

            stmt.execute("""
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
                """);

            stmt.execute("""
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
                """);

            stmt.execute("""
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
                """);

            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM billing_invoices WHERE invoice_number = 'INV-10001'")) {
                if (rs.next() && rs.getLong(1) == 0) {
                    stmt.execute("""
                        INSERT INTO admissions (
                            admission_number, patient_id, attending_doctor_id, department_id,
                            ward_name, room_type, bed_number, admission_date, discharge_date,
                            daily_room_rate, nursing_fee_per_day, admission_reason, discharge_notes, status
                        )
                        SELECT
                            'ADM-10001', p.id, d.id, d.department_id,
                            'Cardiology Observation Ward', 'SEMI_PRIVATE', 'C-104B',
                            CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '4 hours',
                            6500.00, 1500.00,
                            '24-hour blood pressure & cardiac telemetry monitoring for Stage 1 Hypertension with exertional chest tightness.',
                            'Hemodynamically stable. Discharged on oral antihypertensive regimen with outpatient follow-up.',
                            'DISCHARGED'
                        FROM patients p, doctors d
                        WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001'
                        ON CONFLICT (admission_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO billing_invoices (
                            invoice_number, patient_id, appointment_id, admission_id,
                            issue_date, due_date, subtotal, discount_amount, tax_amount,
                            total_amount, paid_amount, balance_due, status, notes
                        )
                        SELECT
                            'INV-10001', p.id, a.id, adm.id,
                            CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_DATE + INTERVAL '7 days',
                            24040.00, 1040.00, 0.00, 23000.00, 15000.00, 8000.00,
                            'PARTIALLY_PAID',
                            'Consolidated hospital bill covering Cardiology Consultation, Hematology & Lipid Lab Panel, Pharmacy Medications, and 2-Day Cardiac Observation Admission.'
                        FROM patients p
                        LEFT JOIN appointments a ON a.appointment_number = 'APT-10001'
                        LEFT JOIN admissions adm ON adm.admission_number = 'ADM-10001'
                        WHERE p.patient_number = 'PAT-10001'
                        ON CONFLICT (invoice_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO billing_invoice_items (
                            invoice_id, charge_type, reference_type, reference_id, reference_code,
                            description, service_date, quantity, unit_price, discount_amount, subtotal
                        )
                        SELECT inv.id, 'CONSULTATION', 'APPOINTMENT', a.id, 'APT-10001',
                            'Specialist Cardiology Consultation - Dr. Kumara Perera',
                            CURRENT_DATE, 1, 3500.00, 0.00, 3500.00
                        FROM billing_invoices inv
                        LEFT JOIN appointments a ON a.appointment_number = 'APT-10001'
                        WHERE inv.invoice_number = 'INV-10001';
                        """);

                    stmt.execute("""
                        INSERT INTO billing_invoice_items (
                            invoice_id, charge_type, reference_type, reference_id, reference_code,
                            description, service_date, quantity, unit_price, discount_amount, subtotal
                        )
                        SELECT inv.id, 'LABORATORY', 'LAB_REQUEST', lr.id, 'LRQ-10001',
                            'Laboratory Diagnostics: Complete Blood Count (CBC) & Lipid Profile',
                            CURRENT_DATE - INTERVAL '1 day', 1, 3700.00, 0.00, 3700.00
                        FROM billing_invoices inv
                        LEFT JOIN lab_requests lr ON lr.request_number = 'LRQ-10001'
                        WHERE inv.invoice_number = 'INV-10001';
                        """);

                    stmt.execute("""
                        INSERT INTO billing_invoice_items (
                            invoice_id, charge_type, reference_type, reference_id, reference_code,
                            description, service_date, quantity, unit_price, discount_amount, subtotal
                        )
                        SELECT inv.id, 'PHARMACY', 'PHARMACY_DISPENSATION', dsp.id, 'DSP-10001',
                            'Pharmacy Medication Dispensation (Amlodipine 5mg x30, Aspirin 75mg x30)',
                            CURRENT_DATE, 1, 840.00, 0.00, 840.00
                        FROM billing_invoices inv
                        LEFT JOIN pharmacy_dispensations dsp ON dsp.dispensation_number = 'DSP-10001'
                        WHERE inv.invoice_number = 'INV-10001';
                        """);

                    stmt.execute("""
                        INSERT INTO billing_invoice_items (
                            invoice_id, charge_type, reference_type, reference_id, reference_code,
                            description, service_date, quantity, unit_price, discount_amount, subtotal
                        )
                        SELECT inv.id, 'ADMISSION', 'ADMISSION', adm.id, 'ADM-10001',
                            'Inpatient Admission: Cardiology Observation Ward (Bed C-104B) - Room & Nursing (2 Days)',
                            CURRENT_DATE, 2, 8000.00, 0.00, 16000.00
                        FROM billing_invoices inv
                        LEFT JOIN admissions adm ON adm.admission_number = 'ADM-10001'
                        WHERE inv.invoice_number = 'INV-10001';
                        """);

                    stmt.execute("""
                        INSERT INTO billing_payments (
                            payment_number, invoice_id, patient_id, payment_date, amount,
                            payment_method, transaction_reference, payer_name, status, notes
                        )
                        SELECT 'PAY-10001', inv.id, inv.patient_id, CURRENT_TIMESTAMP - INTERVAL '2 hours',
                            15000.00, 'CARD', 'TXN-VISA-884920', 'John Doe', 'COMPLETED',
                            'Initial advance settlement via Visa credit card at discharge desk.'
                        FROM billing_invoices inv
                        WHERE inv.invoice_number = 'INV-10001'
                        ON CONFLICT (payment_number) DO NOTHING;
                        """);
                }
            }
            logger.info("Module 3.8 Billing & Admissions database schema verified.");
        } catch (Exception e) {
            logger.warn("Could not auto-verify Module 3.8 Billing schema: {}", e.getMessage());
        }
    }

    private void ensureStaffTablesExist(Connection connection) {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("""
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
                        role_category IN ('DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT', 'ADMINISTRATIVE', 'SUPPORT_STAFF')
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
                """);

            stmt.execute("""
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
                """);

            stmt.execute("""
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
                """);

            stmt.execute("""
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
                """);

            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM staff_employees WHERE employee_number = 'EMP-10001'")) {
                if (rs.next() && rs.getLong(1) == 0) {
                    stmt.execute("""
                        INSERT INTO staff_employees (
                            employee_number, first_name, last_name, nic_or_passport, gender, date_of_birth,
                            contact_number, email, address, emergency_contact_name, emergency_contact_number,
                            role_category, designation, department_id, employment_type, shift_type,
                            join_date, basic_salary, qualification, status, annual_leave_quota, casual_leave_quota, sick_leave_quota, notes
                        )
                        SELECT
                            'EMP-10001', 'Nadeesha', 'Fernando', '199162409182', 'FEMALE', '1991-04-12',
                            '+94772345671', 'nadeesha.fernando@careflow.lk', '45 Temple Road, Nugegoda, Colombo',
                            'Rohan Fernando', '+94779112233',
                            'NURSE', 'Senior Nursing Sister (CCU)', d.id, 'FULL_TIME', 'MORNING',
                            '2021-03-15', 115000.00, 'BSc in Nursing (Hons), RN - Sri Lanka Nursing Council', 'ACTIVE', 14, 7, 7,
                            'Lead cardiac telemetry and ICU/CCU nursing supervisor.'
                        FROM departments d WHERE d.code = 'CARD'
                        ON CONFLICT (employee_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_employees (
                            employee_number, first_name, last_name, nic_or_passport, gender, date_of_birth,
                            contact_number, email, address, emergency_contact_name, emergency_contact_number,
                            role_category, designation, department_id, employment_type, shift_type,
                            join_date, basic_salary, qualification, status, annual_leave_quota, casual_leave_quota, sick_leave_quota, notes
                        )
                        SELECT
                            'EMP-10002', 'Kasun', 'Wijesinghe', '199318502349', 'MALE', '1993-07-04',
                            '+94713456782', 'kasun.wijesinghe@careflow.lk', '18 Station Lane, Dehiwala',
                            'Malini Wijesinghe', '+94718223344',
                            'LABORATORY_STAFF', 'Senior Medical Laboratory Technologist', d.id, 'FULL_TIME', 'REGULAR_DAY',
                            '2022-01-10', 98000.00, 'BSc in Medical Laboratory Sciences (MLS), SLMC Registered', 'ACTIVE', 14, 7, 7,
                            'In charge of Hematology and Clinical Biochemistry analyzers.'
                        FROM departments d WHERE d.code = 'GEN'
                        ON CONFLICT (employee_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_employees (
                            employee_number, first_name, last_name, nic_or_passport, gender, date_of_birth,
                            contact_number, email, address, emergency_contact_name, emergency_contact_number,
                            role_category, designation, department_id, employment_type, shift_type,
                            join_date, basic_salary, qualification, status, annual_leave_quota, casual_leave_quota, sick_leave_quota, notes
                        )
                        SELECT
                            'EMP-10003', 'Tharushi', 'Senanayake', '199573201845', 'FEMALE', '1995-08-19',
                            '+94764567893', 'tharushi.senanayake@careflow.lk', '102 Kandy Road, Kelaniya',
                            'Sunil Senanayake', '+94775544332',
                            'PHARMACIST', 'Chief Hospital Pharmacist', d.id, 'FULL_TIME', 'REGULAR_DAY',
                            '2022-06-01', 105000.00, 'B.Pharm (Hons), SLMC Registered Pharmacist', 'ACTIVE', 14, 7, 7,
                            'Oversees inpatient/outpatient pharmacy dispensing and FEFO narcotic inventory.'
                        FROM departments d WHERE d.code = 'GEN'
                        ON CONFLICT (employee_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_employees (
                            employee_number, first_name, last_name, nic_or_passport, gender, date_of_birth,
                            contact_number, email, address, emergency_contact_name, emergency_contact_number,
                            role_category, designation, department_id, employment_type, shift_type,
                            join_date, basic_salary, qualification, status, annual_leave_quota, casual_leave_quota, sick_leave_quota, notes
                        )
                        SELECT
                            'EMP-10004', 'Dinesh', 'Rajapaksha', '199724109823', 'MALE', '1997-09-28',
                            '+94775678904', 'dinesh.rajapaksha@careflow.lk', '29 Lake Drive, Rajagiriya',
                            'Chamari Rajapaksha', '+94776655441',
                            'RECEPTIONIST', 'Front Desk & Admissions Executive', d.id, 'FULL_TIME', 'MORNING',
                            '2023-02-01', 68000.00, 'Diploma in Healthcare Administration & Customer Relations', 'ACTIVE', 14, 7, 7,
                            'Handles outpatient appointments, queue coordination, and inpatient admissions desk.'
                        FROM departments d WHERE d.code = 'PED'
                        ON CONFLICT (employee_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_employees (
                            employee_number, first_name, last_name, nic_or_passport, gender, date_of_birth,
                            contact_number, email, address, emergency_contact_name, emergency_contact_number,
                            role_category, designation, department_id, employment_type, shift_type,
                            join_date, basic_salary, qualification, status, annual_leave_quota, casual_leave_quota, sick_leave_quota, notes
                        )
                        SELECT
                            'EMP-10005', 'Dilani', 'Gunaratne', '199051208734', 'FEMALE', '1990-01-11',
                            '+94716789015', 'dilani.gunaratne@careflow.lk', '74 Havelock Road, Colombo 05',
                            'Pradeep Gunaratne', '+94714433221',
                            'ACCOUNTANT', 'Senior Billing & Revenue Accountant', d.id, 'FULL_TIME', 'REGULAR_DAY',
                            '2020-11-15', 125000.00, 'BSc Finance, CIMA Passed Finalist', 'ON_LEAVE', 14, 7, 7,
                            'Manages inpatient discharge billing, insurance claims, and daily cash reconciliation.'
                        FROM departments d WHERE d.code = 'ORTHO'
                        ON CONFLICT (employee_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_department_assignments (
                            employee_id, from_department_id, to_department_id, previous_designation, new_designation,
                            previous_shift, new_shift, assignment_type, effective_date, reason
                        )
                        SELECT
                            e.id, NULL, e.department_id, NULL, e.designation,
                            NULL, e.shift_type, 'INITIAL_ASSIGNMENT', e.join_date,
                            'Initial hospital onboarding and clinical department placement.'
                        FROM staff_employees e
                        WHERE e.employee_number IN ('EMP-10001', 'EMP-10002', 'EMP-10003', 'EMP-10004', 'EMP-10005')
                        ON CONFLICT DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_department_assignments (
                            employee_id, from_department_id, to_department_id, previous_designation, new_designation,
                            previous_shift, new_shift, assignment_type, effective_date, reason
                        )
                        SELECT
                            e.id, d_from.id, e.department_id, 'Staff Nurse (General Ward)', 'Senior Nursing Sister (CCU)',
                            'ROTATIONAL', 'MORNING', 'PROMOTION', CURRENT_DATE - INTERVAL '90 days',
                            'Promoted to Senior Nursing Sister and assigned to Cardiology Coronary Care Unit.'
                        FROM staff_employees e, departments d_from
                        WHERE e.employee_number = 'EMP-10001' AND d_from.code = 'GEN'
                        ON CONFLICT DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_attendance (
                            employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
                        )
                        SELECT
                            e.id, CURRENT_DATE, '07:55:00', '16:15:00', e.shift_type, 'PRESENT', 8.33, 0.33, 'On-time morning ward handover completed'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10001'
                        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_attendance (
                            employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
                        )
                        SELECT
                            e.id, CURRENT_DATE, '08:02:00', '17:05:00', e.shift_type, 'PRESENT', 9.05, 1.05, 'Completed STAT hematology batch calibration'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10002'
                        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_attendance (
                            employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
                        )
                        SELECT
                            e.id, CURRENT_DATE, '08:35:00', NULL, e.shift_type, 'LATE', 0.00, 0.00, 'Delayed due to traffic congestion; currently on active pharmacy duty'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10003'
                        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_attendance (
                            employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
                        )
                        SELECT
                            e.id, CURRENT_DATE, '07:50:00', NULL, e.shift_type, 'PRESENT', 0.00, 0.00, 'Checked in at OPD reception desk'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10004'
                        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_attendance (
                            employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
                        )
                        SELECT
                            e.id, CURRENT_DATE, NULL, NULL, e.shift_type, 'ON_LEAVE', 0.00, 0.00, 'Approved annual leave (LVE-10001)'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10005'
                        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_leave_records (
                            leave_number, employee_id, leave_type, start_date, end_date, total_days,
                            reason, handover_notes, emergency_contact, status, reviewed_at, review_comments
                        )
                        SELECT
                            'LVE-10001', e.id, 'ANNUAL', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 4,
                            'Family wedding and personal annual vacation in Kandy.',
                            'Daily billing reconciliation and insurance claim files handed over to Assistant Accountant.',
                            '+94716789015', 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '2 days',
                            'Approved. Handover verified with finance department.'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10005'
                        ON CONFLICT (leave_number) DO NOTHING;
                        """);

                    stmt.execute("""
                        INSERT INTO staff_leave_records (
                            leave_number, employee_id, leave_type, start_date, end_date, total_days,
                            reason, handover_notes, emergency_contact, status
                        )
                        SELECT
                            'LVE-10002', e.id, 'CASUAL', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 2,
                            'Attending SLMC Medical Laboratory Continuing Professional Development (CPD) workshop.',
                            'Routine analyzer quality control assigned to junior lab technologist.',
                            '+94713456782', 'PENDING'
                        FROM staff_employees e WHERE e.employee_number = 'EMP-10002'
                        ON CONFLICT (leave_number) DO NOTHING;
                        """);
                }
            }
            logger.info("Module 3.9 Staff Management database schema verified.");
        } catch (Exception e) {
            logger.warn("Could not auto-verify Module 3.9 Staff Management schema: {}", e.getMessage());
        }
    }
}
