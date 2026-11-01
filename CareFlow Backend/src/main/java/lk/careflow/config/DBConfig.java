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
}
