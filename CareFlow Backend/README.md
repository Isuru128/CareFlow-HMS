
# CareFlow HMS - Backend

The backend REST API for **CareFlow Hospital Management System**, built with Java Spring Boot and Supabase PostgreSQL.

## Tech Stack

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- PostgreSQL (Supabase)
- Maven

## Features

- User Authentication & Role-Based Access Control
- Patient Management
- Doctor & Department Management
- Appointment Scheduling
- Electronic Medical Records
- Laboratory Management
- Pharmacy & Inventory Management
- Billing & Payments
- Staff Management
- Reports & Analytics

## Architecture

The backend follows a layered architecture:

- **Controller** — REST API endpoints
- **Service** — Business logic
- **Repository** — Database operations
- **Entity** — Database models
- **DTO** — Request and response objects
- **Config** — Application configuration and security

## Prerequisites

- Java 21 or compatible project JDK
- Maven (or the included Maven Wrapper)
- Supabase PostgreSQL database

## Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_BACKEND_REPOSITORY_URL>
cd <YOUR_BACKEND_FOLDER>
```

### 2. Configure environment variables

Set the following environment variables:

```env
DB_URL=jdbc:postgresql://<HOST>:<PORT>/<DATABASE>
DB_USERNAME=<DATABASE_USERNAME>
DB_PASSWORD=<DATABASE_PASSWORD>
```

Use the connection details provided by Supabase. Keep credentials private and never commit them to GitHub.

### 3. Run the application

Using Maven:

```bash
mvn spring-boot:run
```

Or, if Maven Wrapper is included:

Windows:

```bash
mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

The API runs at:

`http://localhost:8080`

## API Documentation

API endpoints and request/response formats will be documented as the modules are implemented.

## Development Status

🚧 Under development — intern project.

## License

MIT License
Copyright © 2026 Isuru Rathnayake