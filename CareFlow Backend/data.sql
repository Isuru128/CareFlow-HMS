-- ==============================================================================
-- CareFlow Hospital Management System (HMS)
-- Complete Database Seed Data (DML: INSERT Statements)
-- Target Database: PostgreSQL (Supabase Compatible)
-- Execution Order: Run after schema.sql
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


-- ==============================================================================
-- Module 3.1 - User Management & RBAC Seed Data
-- Default Administrator (Credentials: admin / Admin@123)
-- ==============================================================================
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
-- Module 3.2 - Patient Management Seed Data
-- ==============================================================================
INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    contact_number, email, nic_or_passport, address,
    emergency_contact_name, emergency_contact_number, emergency_contact_relation,
    allergies, status
)
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
-- Module 3.3 & 3.4 - Doctor & Appointment Management Seed Data
-- ==============================================================================
INSERT INTO departments (name, code, description, contact_number, is_active)
VALUES
    ('Cardiology', 'CARD', 'Comprehensive cardiovascular medicine and care', '+94112345001', TRUE),
    ('Pediatrics', 'PED', 'Child health and infant medical treatment', '+94112345002', TRUE),
    ('General Medicine', 'GEN', 'General healthcare, diagnoses, and inpatient care', '+94112345003', TRUE),
    ('Orthopedics', 'ORTHO', 'Musculoskeletal system, spine, joints, and fractures', '+94112345004', TRUE),
    ('Neurology', 'NEUR', 'Brain, spinal cord, and nervous system disorders', '+94112345005', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO doctors (
    doctor_number, first_name, last_name, specialization, license_number,
    department_id, qualification, experience_years, contact_number, email,
    consultation_fee, room_number, bio, status
)
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

INSERT INTO doctors (
    doctor_number, first_name, last_name, specialization, license_number,
    department_id, qualification, experience_years, contact_number, email,
    consultation_fee, room_number, bio, status
)
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

INSERT INTO doctors (
    doctor_number, first_name, last_name, specialization, license_number,
    department_id, qualification, experience_years, contact_number, email,
    consultation_fee, room_number, bio, status
)
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

INSERT INTO appointments (
    appointment_number, patient_id, doctor_id, department_id,
    appointment_date, appointment_time, queue_number,
    appointment_type, status, reason, notes, consultation_fee
)
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
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001'
ON CONFLICT (appointment_number) DO NOTHING;


-- ==============================================================================
-- Module 3.5 - Electronic Medical Records (EMR) Seed Data
-- ==============================================================================
INSERT INTO medical_records (
    record_number, patient_id, doctor_id, appointment_id, visit_date,
    chief_complaint, examination_notes, clinical_notes,
    blood_pressure, temperature_celsius, heart_rate_bpm, respiratory_rate_bpm,
    weight_kg, height_cm, bmi, oxygen_saturation, status
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
    medical_record_id, patient_id, doctor_id, icd10_code, diagnosis_name,
    diagnosis_type, status, severity, diagnosed_date, notes
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
    prescription_number, medical_record_id, patient_id, doctor_id,
    issue_date, valid_until, status, instructions, notes
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
    prescription_id, medication_name, dosage, frequency, route,
    duration, quantity, instructions, is_dispensed
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
    prescription_id, medication_name, dosage, frequency, route,
    duration, quantity, instructions, is_dispensed
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
    patient_id, medical_record_id, doctor_id, treatment_name,
    category, start_date, end_date, status, outcome, procedure_notes, complications
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
    report_number, medical_record_id, patient_id, doctor_id,
    report_title, report_type, report_date, clinical_findings, recommendations, summary, status
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
-- Module 3.6 - Laboratory Management Seed Data
-- ==============================================================================
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

INSERT INTO lab_request_items (request_id, lab_test_id, status, notes)
SELECT
    lr.id,
    lt.id,
    'COMPLETED',
    'Priority processing requested by cardiologist'
FROM lab_requests lr, lab_tests lt
WHERE lr.request_number = 'LRQ-10001' AND lt.test_code IN ('LAB-CBC', 'LAB-LIPID')
ON CONFLICT DO NOTHING;

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


-- ==============================================================================
-- Module 3.7 - Pharmacy Management Seed Data
-- ==============================================================================
INSERT INTO medicines (
    medicine_code, name, generic_name, brand_name, category, dosage_form,
    strength, unit_of_measure, unit_price, reorder_level, manufacturer,
    storage_conditions, description, side_effects, is_active
) VALUES
('MED-10001', 'Paracetamol 500mg', 'Paracetamol', 'Panadol', 'ANALGESIC', 'TABLET', '500 mg', 'TABLET', 5.00, 200, 'GSK Healthcare', 'Store below 30°C in dry place', 'Antipyretic and mild analgesic indicated for fever and mild to moderate pain.', 'Rare nausea, hypersensitivity reactions.', TRUE),
('MED-10002', 'Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Amoxil', 'ANTIBIOTIC', 'CAPSULE', '500 mg', 'CAPSULE', 25.00, 100, 'Pfizer Ltd', 'Store below 25°C protected from moisture', 'Broad spectrum penicillin antibiotic indicated for respiratory and ENT bacterial infections.', 'Nausea, diarrhea, allergic skin rash.', TRUE),
('MED-10003', 'Amlodipine 5mg', 'Amlodipine Besylate', 'Norvasc', 'ANTIHYPERTENSIVE', 'TABLET', '5 mg', 'TABLET', 18.00, 150, 'Novartis Pharma', 'Store at room temperature 15-30°C', 'Calcium channel blocker for essential hypertension and chronic stable angina.', 'Peripheral edema, flushing, headache, dizziness.', TRUE),
('MED-10004', 'Metformin 500mg', 'Metformin Hydrochloride', 'Glucophage', 'ANTIDIABETIC', 'TABLET', '500 mg', 'TABLET', 12.00, 150, 'Merck Sante', 'Store below 25°C', 'Biguanide antihyperglycemic agent for Type 2 Diabetes Mellitus management.', 'Gastrointestinal upset, metallic taste, lactic acidosis (rare).', TRUE),
('MED-10005', 'Omeprazole 20mg', 'Omeprazole', 'Losec', 'GASTROINTESTINAL', 'CAPSULE', '20 mg', 'CAPSULE', 22.00, 100, 'AstraZeneca', 'Store in tight container away from moisture', 'Proton pump inhibitor (PPI) for GERD, dyspepsia, and peptic ulcer disease.', 'Headache, abdominal pain, flatulence, constipation.', TRUE),
('MED-10006', 'Cetirizine 10mg', 'Cetirizine Dihydrochloride', 'Zyrtec', 'ANTIHISTAMINE', 'TABLET', '10 mg', 'TABLET', 15.00, 80, 'Johnson & Johnson', 'Store below 30°C', 'Second generation H1-antihistamine for allergic rhinitis, urticaria, and pruritus.', 'Mild drowsiness, dry mouth, fatigue.', TRUE),
('MED-10007', 'Atorvastatin 20mg', 'Atorvastatin Calcium', 'Lipitor', 'CARDIOVASCULAR', 'TABLET', '20 mg', 'TABLET', 45.00, 80, 'Pfizer Ltd', 'Store between 20-25°C', 'HMG-CoA reductase inhibitor statin indicated for dyslipidemia and cardiovascular prevention.', 'Myalgia, headache, mild elevation in liver enzymes.', TRUE),
('MED-10008', 'Salbutamol Inhaler 100mcg', 'Salbutamol Sulfate', 'Ventolin Evohaler', 'RESPIRATORY', 'INHALER', '100 mcg/dose', 'PIECE', 650.00, 20, 'GSK Healthcare', 'Do not freeze or expose to direct heat', 'Short-acting beta-2 adrenergic agonist bronchodilator for acute asthma bronchospasm.', 'Fine tremors, tachycardia, mild palpitations.', TRUE),
('MED-10009', 'Azithromycin 500mg', 'Azithromycin', 'Zithromax', 'ANTIBIOTIC', 'TABLET', '500 mg', 'TABLET', 95.00, 50, 'Pfizer Ltd', 'Store below 30°C', 'Macrolide antibiotic for community-acquired pneumonia and atypical bacterial infections.', 'Gastrointestinal cramping, nausea, diarrhea.', TRUE),
('MED-10010', 'Vitamin C 500mg', 'Ascorbic Acid', 'C-Vite', 'VITAMINS_SUPPLEMENTS', 'TABLET', '500 mg', 'TABLET', 8.00, 200, 'Astron Health', 'Keep tightly closed in a cool dry area', 'Antioxidant and essential vitamin for immune defense and connective tissue repair.', 'Minimal side effects at recommended dosages.', TRUE),
('MED-10011', 'Aspirin 75mg', 'Acetylsalicylic Acid', 'Cardiprin', 'CARDIOVASCULAR', 'TABLET', '75 mg', 'TABLET', 10.00, 150, 'Bayer AG', 'Store below 25°C', 'Antiplatelet agent for secondary prevention of thromboembolic and ischemic heart events.', 'Gastric irritation, micro-bleeding risk.', TRUE)
ON CONFLICT (medicine_code) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-PARA01', m.id, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '18 months',
    1000, 850, 3.20, 5.00, 'State Pharmaceuticals Corp', CURRENT_DATE - INTERVAL '5 months', 'ACTIVE', 'Prime inventory batch'
FROM medicines m WHERE m.medicine_code = 'MED-10001'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2025-AMX01', m.id, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE + INTERVAL '25 days',
    500, 120, 18.00, 25.00, 'MediLink Distributors', CURRENT_DATE - INTERVAL '17 months', 'ACTIVE', 'Nearing expiry - prioritize FEFO dispensing'
FROM medicines m WHERE m.medicine_code = 'MED-10002'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-AMX02', m.id, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '14 months',
    600, 600, 19.50, 25.00, 'MediLink Distributors', CURRENT_DATE - INTERVAL '1 month', 'ACTIVE', 'New replenishment consignment'
FROM medicines m WHERE m.medicine_code = 'MED-10002'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-AML01', m.id, CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '16 months',
    800, 520, 12.00, 18.00, 'PharmaNet Lanka', CURRENT_DATE - INTERVAL '3 months', 'ACTIVE', 'Good stock level'
FROM medicines m WHERE m.medicine_code = 'MED-10003'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-MET01', m.id, CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '12 months',
    500, 310, 8.50, 12.00, 'Merck Direct', CURRENT_DATE - INTERVAL '4 months', 'ACTIVE', 'Routine clinic issue'
FROM medicines m WHERE m.medicine_code = 'MED-10004'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-OMP01', m.id, CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '20 months',
    400, 260, 14.00, 22.00, 'AstraZeneca Imports', CURRENT_DATE - INTERVAL '2 months', 'ACTIVE', 'Standard stock'
FROM medicines m WHERE m.medicine_code = 'MED-10005'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2024-CET-EXP', m.id, CURRENT_DATE - INTERVAL '25 months', CURRENT_DATE - INTERVAL '15 days',
    300, 45, 9.00, 15.00, 'Johnson Distribution', CURRENT_DATE - INTERVAL '24 months', 'EXPIRED', 'Expired lot marked for safe bio-disposal'
FROM medicines m WHERE m.medicine_code = 'MED-10006'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-CET02', m.id, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '22 months',
    500, 480, 9.50, 15.00, 'Johnson Distribution', CURRENT_DATE - INTERVAL '15 days', 'ACTIVE', 'Active inventory'
FROM medicines m WHERE m.medicine_code = 'MED-10006'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-SLB01', m.id, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '10 months',
    50, 8, 480.00, 650.00, 'GSK Lanka', CURRENT_DATE - INTERVAL '5 months', 'ACTIVE', 'Low stock alert triggered - replenishment requested'
FROM medicines m WHERE m.medicine_code = 'MED-10008'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO medicine_batches (
    batch_number, medicine_id, manufacture_date, expiry_date,
    initial_quantity, current_quantity, unit_purchase_price, unit_selling_price,
    supplier_name, received_date, status, notes
)
SELECT
    'BAT-2026-ASP01', m.id, CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '15 months',
    600, 450, 6.00, 10.00, 'Bayer Lanka', CURRENT_DATE - INTERVAL '2 months', 'ACTIVE', 'Regular issue'
FROM medicines m WHERE m.medicine_code = 'MED-10011'
ON CONFLICT (medicine_id, batch_number) DO NOTHING;

INSERT INTO pharmacy_stock_transactions (
    medicine_id, batch_id, transaction_type, quantity, balance_after, reference_number, notes
)
SELECT
    m.id, b.id, 'PURCHASE_RECEIPT', 1000, 1000, 'PO-2026-001', 'Initial consignment delivery'
FROM medicines m
JOIN medicine_batches b ON b.medicine_id = m.id AND b.batch_number = 'BAT-2026-PARA01'
WHERE m.medicine_code = 'MED-10001'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacy_stock_transactions (
    medicine_id, batch_id, transaction_type, quantity, balance_after, reference_number, notes
)
SELECT
    m.id, b.id, 'PURCHASE_RECEIPT', 800, 800, 'PO-2026-002', 'Initial shipment'
FROM medicines m
JOIN medicine_batches b ON b.medicine_id = m.id AND b.batch_number = 'BAT-2026-AML01'
WHERE m.medicine_code = 'MED-10003'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacy_dispensations (
    dispensation_number, prescription_id, patient_id, patient_name, doctor_name,
    dispensed_at, total_amount, payment_status, status, notes
)
SELECT
    'DSP-10001', rx.id, p.id,
    p.first_name || ' ' || p.last_name,
    d.first_name || ' ' || d.last_name,
    CURRENT_TIMESTAMP - INTERVAL '18 hours',
    840.00, 'PAID', 'COMPLETED',
    'Prescription fulfilled in full with patient counseling provided.'
FROM prescriptions rx
JOIN patients p ON rx.patient_id = p.id
JOIN doctors d ON rx.doctor_id = d.id
WHERE rx.prescription_number = 'RX-10001'
ON CONFLICT (dispensation_number) DO NOTHING;

INSERT INTO pharmacy_dispensation_items (
    dispensation_id, medicine_id, batch_id, quantity, unit_price, subtotal, dosage_instructions
)
SELECT
    d.id, m.id, b.id, 30, 18.00, 540.00, '1 tablet every morning with or without food'
FROM pharmacy_dispensations d
JOIN medicines m ON m.medicine_code = 'MED-10003'
JOIN medicine_batches b ON b.medicine_id = m.id AND b.batch_number = 'BAT-2026-AML01'
WHERE d.dispensation_number = 'DSP-10001'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacy_dispensation_items (
    dispensation_id, medicine_id, batch_id, quantity, unit_price, subtotal, dosage_instructions
)
SELECT
    d.id, m.id, b.id, 30, 10.00, 300.00, '1 tablet after dinner with a full glass of water'
FROM pharmacy_dispensations d
JOIN medicines m ON m.medicine_code = 'MED-10011'
JOIN medicine_batches b ON b.medicine_id = m.id AND b.batch_number = 'BAT-2026-ASP01'
WHERE d.dispensation_number = 'DSP-10001'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacy_stock_transactions (
    medicine_id, batch_id, transaction_type, quantity, balance_after, reference_number, notes
)
SELECT
    m.id, b.id, 'DISPENSE', -30, b.current_quantity, 'DSP-10001', 'Dispensed against prescription RX-10001'
FROM medicines m
JOIN medicine_batches b ON b.medicine_id = m.id AND b.batch_number = 'BAT-2026-AML01'
WHERE m.medicine_code = 'MED-10003'
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- Module 3.8 - Billing System (Admissions, Invoices, Charges & Payments) Seed Data
-- ==============================================================================
INSERT INTO admissions (
    admission_number, patient_id, attending_doctor_id, department_id,
    ward_name, room_type, bed_number, admission_date, discharge_date,
    daily_room_rate, nursing_fee_per_day, admission_reason, discharge_notes, status
)
SELECT
    'ADM-10001',
    p.id,
    d.id,
    d.department_id,
    'Cardiology Observation Ward',
    'SEMI_PRIVATE',
    'C-104B',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '4 hours',
    6500.00,
    1500.00,
    '24-hour blood pressure & cardiac telemetry monitoring for Stage 1 Hypertension with exertional chest tightness.',
    'Hemodynamically stable. Discharged on oral antihypertensive regimen with outpatient follow-up.',
    'DISCHARGED'
FROM patients p, doctors d
WHERE p.patient_number = 'PAT-10001' AND d.doctor_number = 'DOC-10001'
ON CONFLICT (admission_number) DO NOTHING;

INSERT INTO billing_invoices (
    invoice_number, patient_id, appointment_id, admission_id,
    issue_date, due_date, subtotal, discount_amount, tax_amount,
    total_amount, paid_amount, balance_due, status, notes
)
SELECT
    'INV-10001',
    p.id,
    a.id,
    adm.id,
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    CURRENT_DATE + INTERVAL '7 days',
    24040.00,
    1040.00,
    0.00,
    23000.00,
    15000.00,
    8000.00,
    'PARTIALLY_PAID',
    'Consolidated hospital bill covering Cardiology Consultation, Hematology & Lipid Lab Panel, Pharmacy Medications, and 2-Day Cardiac Observation Admission.'
FROM patients p
LEFT JOIN appointments a ON a.appointment_number = 'APT-10001'
LEFT JOIN admissions adm ON adm.admission_number = 'ADM-10001'
WHERE p.patient_number = 'PAT-10001'
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO billing_invoice_items (
    invoice_id, charge_type, reference_type, reference_id, reference_code,
    description, service_date, quantity, unit_price, discount_amount, subtotal
)
SELECT
    inv.id,
    'CONSULTATION',
    'APPOINTMENT',
    a.id,
    'APT-10001',
    'Specialist Cardiology Consultation - Dr. Kumara Perera',
    CURRENT_DATE,
    1,
    3500.00,
    0.00,
    3500.00
FROM billing_invoices inv
LEFT JOIN appointments a ON a.appointment_number = 'APT-10001'
WHERE inv.invoice_number = 'INV-10001'
ON CONFLICT DO NOTHING;

INSERT INTO billing_invoice_items (
    invoice_id, charge_type, reference_type, reference_id, reference_code,
    description, service_date, quantity, unit_price, discount_amount, subtotal
)
SELECT
    inv.id,
    'LABORATORY',
    'LAB_REQUEST',
    lr.id,
    'LRQ-10001',
    'Laboratory Diagnostics: Complete Blood Count (CBC) & Lipid Profile',
    CURRENT_DATE - INTERVAL '1 day',
    1,
    3700.00,
    0.00,
    3700.00
FROM billing_invoices inv
LEFT JOIN lab_requests lr ON lr.request_number = 'LRQ-10001'
WHERE inv.invoice_number = 'INV-10001'
ON CONFLICT DO NOTHING;

INSERT INTO billing_invoice_items (
    invoice_id, charge_type, reference_type, reference_id, reference_code,
    description, service_date, quantity, unit_price, discount_amount, subtotal
)
SELECT
    inv.id,
    'PHARMACY',
    'PHARMACY_DISPENSATION',
    dsp.id,
    'DSP-10001',
    'Pharmacy Medication Dispensation (Amlodipine 5mg x30, Aspirin 75mg x30)',
    CURRENT_DATE,
    1,
    840.00,
    0.00,
    840.00
FROM billing_invoices inv
LEFT JOIN pharmacy_dispensations dsp ON dsp.dispensation_number = 'DSP-10001'
WHERE inv.invoice_number = 'INV-10001'
ON CONFLICT DO NOTHING;

INSERT INTO billing_invoice_items (
    invoice_id, charge_type, reference_type, reference_id, reference_code,
    description, service_date, quantity, unit_price, discount_amount, subtotal
)
SELECT
    inv.id,
    'ADMISSION',
    'ADMISSION',
    adm.id,
    'ADM-10001',
    'Inpatient Admission: Cardiology Observation Ward (Bed C-104B) - Room & Nursing (2 Days)',
    CURRENT_DATE,
    2,
    8000.00,
    0.00,
    16000.00
FROM billing_invoices inv
LEFT JOIN admissions adm ON adm.admission_number = 'ADM-10001'
WHERE inv.invoice_number = 'INV-10001'
ON CONFLICT DO NOTHING;

INSERT INTO billing_payments (
    payment_number, invoice_id, patient_id, payment_date, amount,
    payment_method, transaction_reference, payer_name, status, notes
)
SELECT
    'PAY-10001',
    inv.id,
    inv.patient_id,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    15000.00,
    'CARD',
    'TXN-VISA-884920',
    'John Doe',
    'COMPLETED',
    'Initial advance settlement via Visa credit card at discharge desk.'
FROM billing_invoices inv
WHERE inv.invoice_number = 'INV-10001'
ON CONFLICT (payment_number) DO NOTHING;


-- ==============================================================================
-- Module 3.9 - Staff Management Seed Data
-- ==============================================================================
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

INSERT INTO staff_attendance (
    employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
)
SELECT
    e.id, CURRENT_DATE, '07:55:00', '16:15:00', e.shift_type, 'PRESENT', 8.33, 0.33, 'On-time morning ward handover completed'
FROM staff_employees e WHERE e.employee_number = 'EMP-10001'
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

INSERT INTO staff_attendance (
    employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
)
SELECT
    e.id, CURRENT_DATE, '08:02:00', '17:05:00', e.shift_type, 'PRESENT', 9.05, 1.05, 'Completed STAT hematology batch calibration'
FROM staff_employees e WHERE e.employee_number = 'EMP-10002'
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

INSERT INTO staff_attendance (
    employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
)
SELECT
    e.id, CURRENT_DATE, '08:35:00', NULL, e.shift_type, 'LATE', 0.00, 0.00, 'Delayed due to traffic congestion; currently on active pharmacy duty'
FROM staff_employees e WHERE e.employee_number = 'EMP-10003'
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

INSERT INTO staff_attendance (
    employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
)
SELECT
    e.id, CURRENT_DATE, '07:50:00', NULL, e.shift_type, 'PRESENT', 0.00, 0.00, 'Checked in at OPD reception desk'
FROM staff_employees e WHERE e.employee_number = 'EMP-10004'
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

INSERT INTO staff_attendance (
    employee_id, attendance_date, check_in_time, check_out_time, shift_type, status, working_hours, overtime_hours, remarks
)
SELECT
    e.id, CURRENT_DATE, NULL, NULL, e.shift_type, 'ON_LEAVE', 0.00, 0.00, 'Approved annual leave (LVE-10001)'
FROM staff_employees e WHERE e.employee_number = 'EMP-10005'
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

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


-- ==============================================================================
-- Module 3.10 - Hospital Reports & Analytics Seed Data
-- ==============================================================================
INSERT INTO hospital_reports (
    report_number, report_title, report_category, period_start, period_end,
    department_name, total_records_analyzed, primary_metric_label, primary_metric_value,
    executive_summary, key_findings, recommendations, status
) VALUES
(
    'RPT-10001',
    'Monthly Patient Demographics, Admissions & Registration Analytics',
    'PATIENT_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'All Hospital Departments',
    12,
    'Active Registered Patients',
    '100% Active Cohort',
    'Comprehensive evaluation of outpatient registrations, inpatient ward admissions, blood group distribution, and demographic profiles across CareFlow HMS.',
    '1. 100% of registered patients have verified emergency contact and blood group records.\n2. Cardiology Observation Ward recorded 2-day average length of stay.\n3. Zero patient readmissions within 30 days of discharge.',
    'Continue mandatory allergy and blood group verification at outpatient registration desk.',
    'FINALIZED'
),
(
    'RPT-10002',
    'Outpatient Clinic Appointment Volume & Specialist Utilization Report',
    'APPOINTMENT_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'Cardiology & General Medicine',
    15,
    'Appointment Fulfillment Rate',
    '92.5% Completed / Active',
    'Analysis of scheduled consultations, queue turnaround times, specialist booking density, and cancellation/no-show ratios across clinical departments.',
    '1. Cardiology and General Medicine lead outpatient consultation bookings.\n2. Morning clinic slots (09:00 - 12:00) demonstrate highest patient attendance.\n3. Low cancellation rate across confirmed appointments.',
    'Expand morning consultation capacity for Cardiology and Pediatrics on peak weekdays.',
    'FINALIZED'
),
(
    'RPT-10003',
    'Hospital Financial Revenue, Collections & Charge Category Breakdown',
    'REVENUE_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'Finance & Billing Division',
    25,
    'Gross Billed Revenue',
    'LKR 23,000.00+',
    'Consolidated financial audit covering Consultation fees, Laboratory diagnostic charges, Pharmacy medication sales, and Inpatient Admission room/nursing tariffs.',
    '1. Inpatient Admission charges and Specialist Consultations represent top revenue drivers.\n2. Card and Cash settlements account for primary collection channels.\n3. Partial payments tracked with automated balance due aging.',
    'Follow up on partially paid discharge invoices within 7-day credit window.',
    'FINALIZED'
),
(
    'RPT-10004',
    'Pharmacy Formulary Valuation, FEFO Batch Expiry & Dispensing Report',
    'PHARMACY_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'Hospital Pharmacy',
    21,
    'Formulary Availability',
    '11 Active Drug Lines',
    'Inventory audit of active medicine batches, FEFO expiry risk monitoring, low-stock reorder alerts, and prescription vs OTC dispensing revenue.',
    '1. Salbutamol Inhaler 100mcg flagged below reorder threshold (8 units remaining).\n2. Amoxicillin batch BAT-2025-AMX01 prioritized under FEFO (<30 days to expiry).\n3. Expired Cetirizine lot isolated for bio-safe disposal.',
    'Issue immediate replenishment purchase order for Salbutamol Inhalers and complete FEFO rotation.',
    'FINALIZED'
),
(
    'RPT-10005',
    'Diagnostic Laboratory Turnaround Time & Abnormal Result Flag Report',
    'LABORATORY_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'Central Diagnostic Laboratory',
    18,
    'Diagnostic Completion Rate',
    '100% Verified Reports',
    'Clinical pathology performance review covering Hematology, Biochemistry, Immunology, and Microbiology test volume, sample collection barcoding, and critical/high flag rates.',
    '1. Complete Blood Count (CBC) and Lipid Profile are top requested diagnostic panels.\n2. 33% of lipid parameters flagged HIGH (Total Cholesterol & Triglycerides), enabling early cardiac intervention.\n3. All STAT and Urgent requests met target turnaround time.',
    'Maintain automated HIGH/CRITICAL result flagging integration with physician EMR dashboard.',
    'FINALIZED'
),
(
    'RPT-10006',
    'Human Resources Staffing, Shift Attendance & Leave Utilization Report',
    'STAFF_REPORT',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'Human Resources & Administration',
    17,
    'Daily Shift Attendance Rate',
    '80.0% Active On-Duty',
    'Workforce analytics covering nursing, laboratory, pharmacy, reception, and accounting staff distribution, daily shift check-ins, overtime hours, and leave balances.',
    '1. 5 core clinical and administrative staff distributed across Cardiology, General Medicine, Pediatrics, and Orthopedics.\n2. Morning and Regular Day shifts maintain 100% ward coverage.\n3. All annual and casual leave requests remain within statutory entitlements.',
    'Cross-train outpatient receptionists for inpatient admissions desk coverage during annual leave periods.',
    'FINALIZED'
)
ON CONFLICT (report_number) DO NOTHING;

