# ==============================================================================
# CareFlow Hospital Management System (HMS) - Complete Production Dockerfile
# Target Platform : Render.com Web Service (Docker Runtime)
# Stack           : Java 21 (Eclipse Temurin) + Spring Boot 4.1.1 + PostgreSQL
# Modules         : Auth, Patient, Doctor, Appointment, EMR, Lab, Pharmacy,
#                   Billing (3.8), Staff Management (3.9), Reports (3.10)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Maven Build Stage (JDK 21 Alpine)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven Wrapper and POM first to maximize Docker layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize Windows CRLF line endings to Unix LF and grant execution permissions
RUN sed -i 's/\r$//' mvnw .mvn/wrapper/maven-wrapper.properties && \
    chmod +x mvnw

# Download dependencies in offline cache layer
RUN ./mvnw dependency:go-offline -B

# Copy application source code and SQL schema resources (schema.sql, application.properties)
COPY src/ ./src/

# Package executable Spring Boot fat JAR (skip unit tests during container build)
RUN ./mvnw clean package -DskipTests -B && \
    cp /build/target/CareFlow-*.jar /build/target/app.jar

# ------------------------------------------------------------------------------
# Stage 2: Lightweight Production Runtime Stage (JRE 21 Alpine)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="CareFlow HMS Engineering"
LABEL description="CareFlow Hospital Management System - Spring Boot REST API"
LABEL version="1.0.0"

# Install curl (for Render/Docker healthchecks) and tzdata (for Sri Lanka Standard Time)
RUN apk add --no-cache curl tzdata

# Set working directory
WORKDIR /app

# Create a dedicated non-root system user and group for container security
RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Pre-create writable directories inside /app (never inside /tmp during build, as Render mounts fresh tmpfs on /tmp)
RUN mkdir -p /app/uploads/patient-documents /app/tmp && \
    chown -R appuser:appgroup /app

# Copy compiled executable JAR from builder stage with non-root ownership
COPY --from=builder --chown=appuser:appgroup /build/target/app.jar /app/app.jar

# Switch to non-root user
USER appuser

# Environment defaults (Render automatically injects PORT, DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET)
ENV TZ=Asia/Colombo \
    PORT=8080 \
    UPLOAD_DIR=/app/uploads/patient-documents \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8"

# Expose application port (Render dynamically maps PORT at runtime)
EXPOSE ${PORT}

# Container healthcheck hitting the public health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT:-8080}/api/public/health || exit 1

# Ensure writable temp and upload dirs exist at runtime and launch Spring Boot on Render's $PORT
ENTRYPOINT ["sh", "-c", "mkdir -p /app/uploads/patient-documents /app/tmp && exec java $JAVA_OPTS -Djava.io.tmpdir=/app/tmp -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
