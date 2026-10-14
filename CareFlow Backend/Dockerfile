# ==============================================================================
# CareFlow Hospital Management System (HMS) - Backend Dockerfile
# Optimized for Render.com deployment with Multi-stage Build & Eclipse Temurin 21
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the application using Maven Wrapper
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper files and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings (prevents Windows CRLF errors) and ensure executable rights
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Pre-fetch project dependencies to leverage Docker layer caching
RUN ./mvnw dependency:go-offline -B

# Copy project source code
COPY src/ ./src/

# Compile and package Spring Boot executable jar
RUN ./mvnw clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Create lightweight production runtime image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built jar from the builder stage
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

# Switch to non-root user
USER appuser

# Render automatically sets the PORT environment variable (default 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Configure JVM options for container memory limits
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
