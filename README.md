# CareFlow HMS — Hospital Management System

**CareFlow HMS** is a full-stack, enterprise-grade **Hospital Management System** engineered to streamline clinical, diagnostic, pharmaceutical, financial, human resource, and executive reporting operations across modern healthcare facilities.

Built with **Java 21 & Spring Boot** on the backend, **React 19 & Vite** on the frontend, and **PostgreSQL (Supabase)** for cloud-native relational persistence, CareFlow HMS delivers a unified digital platform for hospital administrators, physicians, nurses, receptionists, laboratory technologists, pharmacists, and billing accountants.

---

## Table of Contents

- [Core Modules (3.1 – 3.10)](#core-modules-31--310)
- [Technology Stack](#technology-stack)
- [System Architecture & Project Structure](#system-architecture--project-structure)
- [Database Architecture (`schema.sql` & `data.sql`)](#database-architecture-schemasql--datasql)
- [Getting Started (Local Setup)](#getting-started-local-setup)
  - [1. Database Initialization](#1-database-initialization)
  - [2. Backend Setup (`CareFlow Backend`)](#2-backend-setup-careflow-backend)
  - [3. Frontend Setup (`CareFlow Frontend`)](#3-frontend-setup-careflow-frontend)
- [Default Login Credentials](#default-login-credentials)
- [REST API Endpoints Overview](#rest-api-endpoints-overview)
- [Docker & Render.com Deployment](#docker--rendercom-deployment)
- [Running Automated Tests](#running-automated-tests)
- [License](#license)

---

## Core Modules (3.1 – 3.10)

### 3.1 User Management & Role-Based Access Control (RBAC)
- **JWT Authentication & Session Security**: Stateless access tokens, rotating refresh tokens (`refresh_tokens`), account lockout protection after repeated failed attempts, and cryptographic password reset workflows (`password_reset_tokens`).
- **Granular RBAC**: Supports 7 clinical and operational roles (`ROLE_ADMIN`, `ROLE_DOCTOR`, `ROLE_NURSE`, `ROLE_RECEPTIONIST`, `ROLE_LABORATORY_STAFF`, `ROLE_PHARMACIST`, `ROLE_ACCOUNTANT`).
- **Immutable Security Audit Trail**: Logs authentication events, role changes, and administrative actions with IP address and user-agent metadata (`audit_logs`).

### 3.2 Patient Management
- **Patient Registry**: Unique patient numbering (`PAT-XXXXX`), demographics, blood group, NIC/Passport, allergies, and emergency contact details (`patients`).
- ** longitudinal Medical History**: Chronic conditions, past surgeries, ongoing medications, and clinical notes (`patient_medical_history`).
- **Clinical Document Vault**: Multipart file upload, preview, and download for lab reports, scans, discharge summaries, and ID proofs (`patient_documents`).

### 3.3 Doctor & Department Management
- **Hospital Departments**: Clinical department directory with unique codes and active status tracking (`departments`).
- **Physician Profiles**: SLMC license tracking, specializations, qualifications, consultation fees, and assigned consulting rooms (`doctors`).
- **Recurring Weekly Schedules**: Configurable day-of-week time slots, slot durations, and maximum patient capacities (`doctor_schedules`).

### 3.4 Appointment Management
- **Smart Appointment Booking**: Automated queue numbering per doctor/date, slot validation, and consultation fee binding (`appointments`).
- **Full Lifecycle Tracking**: Supports `CONSULTATION`, `FOLLOW_UP`, `ROUTINE_CHECKUP`, and `EMERGENCY` visits across `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `RESCHEDULED`, `CANCELLED`, and `NO_SHOW` states.

### 3.5 Electronic Medical Records (EMR)
- **Clinical Encounters & Vital Signs**: Captures chief complaints, examination notes, BP, temperature, heart rate, respiratory rate, SpO2, weight, height, and auto-calculated BMI (`medical_records`).
- **ICD-10 Diagnoses**: Primary, secondary, provisional, differential, and final diagnoses with severity and chronicity tracking (`patient_diagnoses`).
- **Digital Prescriptions (e-Rx)**: Multi-item medication orders with dosage, route, frequency, duration, and pharmacy fulfillment status (`prescriptions`, `prescription_items`).
- **Treatment Histories & Clinical Reports**: Tracks procedures, therapies, clinical outcomes (`treatment_histories`), and printable medical/discharge reports (`medical_reports`).

### 3.6 Laboratory Management
- **Diagnostic Test Catalog**: Standardized catalog across Hematology, Biochemistry, Immunology, Microbiology, Pathology, Urinalysis, and Radiology (`lab_tests`).
- **Physician Test Orders**: `ROUTINE`, `URGENT`, and `STAT` priority test requisitions (`lab_requests`, `lab_request_items`).
- **Specimen Barcoding & Chain of Custody**: Tracks sample collection sites, barcodes (`SMP-YYYYMMDD-XXXX`), receipt in lab, or rejection reasons (`lab_samples`).
- **Quantitative Results & Printable Lab Reports**: Parameter-level results with `NORMAL`, `LOW`, `HIGH`, `ABNORMAL`, and `CRITICAL` flags (`lab_results`) and verified diagnostic reports (`lab_reports`).

### 3.7 Pharmacy & Inventory Management
- **Medicine Formulary**: Drug catalog with generic/brand names, categories, dosage forms, strengths, unit prices, and reorder thresholds (`medicines`).
- **FEFO Batch & Expiry Tracking**: Lot-level stock tracking (`medicine_batches`) enforcing **First-Expired, First-Out (FEFO)** dispensing, low-stock alerts, and near-expiry/expired quarantine monitoring.
- **Prescription Dispensing & Direct OTC Counter**: One-click fulfillment of doctor e-Prescriptions or walk-in OTC sales with printable receipts (`pharmacy_dispensations`, `pharmacy_dispensation_items`).
- **Stock Ledger**: Complete audit trail of purchase receipts, dispensations, returns, adjustments, and bio-safe expired disposals (`pharmacy_stock_transactions`).

### 3.8 Billing System & Inpatient Admissions
- **Inpatient Ward & Bed Admissions**: Tracks ward allocations, room types (`GENERAL_WARD`, `SEMI_PRIVATE`, `PRIVATE_ROOM`, `DELUXE_SUITE`, `ICU`, `NICU`, `EMERGENCY_OBSERVATION`), daily room/nursing rates, and discharge calculations (`admissions`).
- **Automated Patient Charge Discovery**: Auto-fetches unbilled Appointments, Lab Requests, Pharmacy Dispensations, and Inpatient Admissions for any selected patient to assemble consolidated invoices.
- **Invoices & Multi-Mode Payments**: Manages subtotal, discounts, taxes, partial/installment payments, balance due aging, and printable receipts across `CASH`, `CARD`, `BANK_TRANSFER`, `INSURANCE`, `ONLINE`, and `CHEQUE` (`billing_invoices`, `billing_invoice_items`, `billing_payments`).

### 3.9 Staff Management (HR & Workforce Operations)
- **Employee Registry**: Comprehensive profiles for nurses, laboratory technologists, pharmacists, receptionists, accountants, doctors, and support staff (`staff_employees`).
- **Daily Shift Attendance**: Check-in/check-out logging, automatic working hour and overtime calculation across `MORNING`, `EVENING`, `NIGHT`, `ROTATIONAL`, and `REGULAR_DAY` shifts (`staff_attendance`).
- **Department Transfers & Promotions**: Historical audit trail of initial placements, inter-departmental transfers, promotions, and shift reassignments (`staff_department_assignments`).
- **Leave Management**: Annual, casual, sick, maternity/paternity, and study leave requests with quota balance tracking and supervisor approval workflows (`staff_leave_records`).

### 3.10 Hospital Reports & Executive Analytics
- **Live Real-Time Analytics Engine**: Computes live KPIs across all 6 reporting pillars:
  1. **Patient Reports** (Demographics, gender/age/blood group distribution, inpatient census)
  2. **Appointment Reports** (Completion/cancellation rates, department & doctor workload)
  3. **Revenue Reports** (Gross billed, net revenue, collection rate, revenue by charge category & payment method)
  4. **Pharmacy Reports** (Inventory cost vs. retail valuation, stock alerts, category & supplier breakdowns)
  5. **Laboratory Reports** (Test volume, completion rate, abnormal/critical result ratios, priority breakdown)
  6. **Staff Reports** (Workforce headcount, shift attendance rate, overtime hours, monthly payroll commitment)
- **Saved Report Snapshots & Print View**: Generates, archives, and prints formal executive report snapshots (`hospital_reports`) with CSV export support.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 4.1.1, Spring MVC, Spring Data JPA (Hibernate), Spring Security, Jakarta Validation |
| **Authentication** | JSON Web Tokens (`jjwt 0.12.6`), BCrypt Password Hashing, Refresh Token Rotation |
| **Database** | PostgreSQL (Supabase Cloud PostgreSQL with HikariCP & PgBouncer Transaction Pooler support) |
| **Frontend** | React 19, Vite 8, React Router v7, Axios, Lucide React Icons, Responsive Custom CSS Design System |
| **DevOps & Cloud** | Docker (Multi-Stage Eclipse Temurin 21 Alpine), Render.com Blueprint (`render.yaml`), Maven Wrapper |
| **Testing** | JUnit Jupiter, Mockito, Spring MockMvc |

---

## System Architecture & Project Structure

```text
CareFlow-HMS/
├── CareFlow Backend/                  # Spring Boot REST API
│   ├── src/main/java/lk/careflow/
│   │   ├── config/                    # SecurityConfig, JwtUtils, AuthTokenFilter, DBConfig
│   │   ├── controller/                # REST Controllers (user, patient, doctor, appointment, emr, lab, pharmacy, billing, staff, report)
│   │   ├── dto/                       # Request & Response Data Transfer Objects
│   │   ├── entity/                    # JPA Entities & Domain Enums (38 tables)
│   │   ├── exception/                 # GlobalExceptionHandler & Custom API Exceptions
│   │   ├── repository/                # Spring Data JPA Repositories
│   │   └── service/                   # Transactional Business Logic & Analytics Services
│   ├── src/main/resources/
│   │   └── application.properties     # Spring Boot, HikariCP, JPA & JWT configuration
│   ├── src/test/java/lk/careflow/     # Unit & Controller Test Suites (59 tests)
│   ├── schema.sql                     # Complete PostgreSQL DDL (38 Tables, 132 Indexes, Triggers)
│   ├── data.sql                       # Complete Idempotent Seed Data (68 INSERT statements)
│   ├── Dockerfile                     # Multi-stage production Dockerfile for Render.com
│   └── pom.xml                        # Maven dependencies & build configuration
│
├── CareFlow Frontend/                 # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── components/layout/         # MainLayout, Sidebar, Navbar (with Logout Confirmation Modal)
│   │   ├── context/                   # AuthContext (JWT session & RBAC state)
│   │   ├── features/                  # Modular feature APIs, modals & badges (auth, users, patients, doctors, appointments, emr, lab, pharmacy, billing, staff, reports)
│   │   ├── pages/                     # Dashboard & Module Pages
│   │   ├── routes/                    # AppRoutes & ProtectedRoute guards
│   │   ├── services/api/              # Axios client with automatic JWT interceptor
│   │   └── styles/                    # Global responsive CSS design system & print stylesheets
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile                         # Root-level multi-stage Dockerfile for Render.com
├── render.yaml                        # Render.com Infrastructure-as-Code Blueprint
└── README.md
```

---

## Database Architecture (`schema.sql` & `data.sql`)

The PostgreSQL database schema is cleanly separated into DDL and DML scripts inside `CareFlow Backend/`:

- **[`CareFlow Backend/schema.sql`](CareFlow%20Backend/schema.sql)**:
  - **38 `CREATE TABLE IF NOT EXISTS` statements** across Modules 3.1 – 3.10.
  - **132 `CREATE INDEX IF NOT EXISTS` statements** optimizing foreign keys, search filters, status flags, and date ranges.
  - **Automatic `updated_at` triggers** powered by `update_timestamp_column()`.
- **[`CareFlow Backend/data.sql`](CareFlow%20Backend/data.sql)**:
  - **68 idempotent `INSERT INTO ... ON CONFLICT DO NOTHING` statements** seeding default administrator credentials, departments, doctors, schedules, patients, appointments, EMR records, lab catalog/results, pharmacy formulary/batches, inpatient admissions/invoices/payments, HR staff/attendance/leaves, and executive analytical reports.

---

## Getting Started (Local Setup)

### Prerequisites
- **Java 21 JDK** (e.g., Eclipse Temurin 21)
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** (Local instance or **Supabase** PostgreSQL project)

### 1. Database Initialization
Open your PostgreSQL client or **Supabase SQL Editor** and execute:
1. [`CareFlow Backend/schema.sql`](CareFlow%20Backend/schema.sql) (creates all tables, constraints, indexes, and triggers)
2. [`CareFlow Backend/data.sql`](CareFlow%20Backend/data.sql) (loads initial sample data)

> **Note:** On application startup, [`DBConfig.java`](CareFlow%20Backend/src/main/java/lk/careflow/config/DBConfig.java) also verifies connectivity and auto-provisions schema tables for Billing, Staff Management, and Hospital Reports if not already present.

### 2. Backend Setup (`CareFlow Backend`)
Navigate to the backend folder and configure your environment variables (or create a `.env` file based on `.env.example`):

```bash
cd "CareFlow Backend"
```

```env
PORT=8080
DB_URL=jdbc:postgresql://<HOST>:6543/postgres?sslmode=require&prepareThreshold=0
DB_USERNAME=postgres.<PROJECT_REF>
DB_PASSWORD=<YOUR_DB_PASSWORD>
JWT_SECRET=<YOUR_BASE64_OR_PLAIN_SECRET_KEY>
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
```

Run the Spring Boot server:

```powershell
# Windows (PowerShell / CMD)
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The backend API will start at **`http://localhost:8080`** (Health check: `http://localhost:8080/api/public/health`).

### 3. Frontend Setup (`CareFlow Frontend`)
Open a new terminal in the frontend directory:

```bash
cd "CareFlow Frontend"
npm install
```

Create a `.env` file in `CareFlow Frontend/` (optional for local development as it defaults to `http://localhost:8080/api`):

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the Vite development server:

```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## Default Login Credentials

After running `data.sql`, you can sign in using the default system administrator account:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **System Administrator (`ROLE_ADMIN`)** | `admin` | `admin@careflow.lk` | `Admin@123` |

---

## REST API Endpoints Overview

| Module | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| **Health Check** | `/`, `/health`, `/api/public/health` | Public readiness & container health probe (`200 OK`) |
| **3.1 Auth & Users** | `/api/auth`, `/api/users` | Login, token refresh, logout, password reset, user CRUD, role assignment, audit logs |
| **3.2 Patients** | `/api/patients` | Patient registration, search, medical history CRUD, document upload & download |
| **3.3 Doctors** | `/api/departments`, `/api/doctors` | Department CRUD, doctor registration, weekly schedule & slot management |
| **3.4 Appointments** | `/api/appointments` | Booking, rescheduling, cancellation, status transitions, calendar events & stats |
| **3.5 EMR** | `/api/emr` | Medical records, vitals, ICD-10 diagnoses, prescriptions, treatments & clinical reports |
| **3.6 Laboratory** | `/api/lab` | Test catalog, lab requests, barcoded sample collection, result entry & verified lab reports |
| **3.7 Pharmacy** | `/api/pharmacy` | Medicine formulary, FEFO stock batches, prescription dispensing, OTC sales & stock ledger |
| **3.8 Billing** | `/api/admissions`, `/api/billing` | Inpatient admissions/discharges, unbilled charge lookup, invoice generation & payments |
| **3.9 Staff (HR)** | `/api/staff` | Employee profiles, daily check-in/out attendance, department transfers & leave approvals |
| **3.10 Reports** | `/api/reports` | Live analytics across 6 pillars (`/api/reports/analytics/*`) & saved report snapshots |

---

## Docker & Render.com Deployment

Both [`CareFlow Backend/Dockerfile`](CareFlow%20Backend/Dockerfile) and the repository-root [`Dockerfile`](Dockerfile) use a hardened multi-stage build (`eclipse-temurin:21-jdk-alpine` → `eclipse-temurin:21-jre-alpine`) with:
- Automatic Windows `CRLF` to Unix `LF` normalization for `mvnw`
- Non-root execution (`appuser:appgroup`, UID `1001`) with pre-provisioned writable upload directories
- Container-aware JVM memory limits (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`)
- Dynamic `$PORT` binding (`-Dserver.port=${PORT:-8080}`) and built-in `HEALTHCHECK`

### Deploying on Render.com
1. Create a new **Web Service** on [Render.com](https://dashboard.render.com) connected to this GitHub repository (`main` branch).
2. Set **Runtime** to `Docker` and **Health Check Path** to `/api/public/health`.
3. Add the environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS=86400000`, `JWT_REFRESH_EXPIRATION_MS=604800000`, and `TZ=Asia/Colombo`.
4. Alternatively, deploy directly using the included [`render.yaml`](render.yaml) Blueprint.

---

## Running Automated Tests

To execute the backend unit and controller test suite (59 tests):

```powershell
cd "CareFlow Backend"
.\mvnw.cmd test
```

To verify the production frontend bundle:

```bash
cd "CareFlow Frontend"
npm run build
```

---

## License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.  
Copyright © 2026 **Isuru Rathnayake**
