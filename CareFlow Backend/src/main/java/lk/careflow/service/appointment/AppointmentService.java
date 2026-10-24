package lk.careflow.service.appointment;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.appointment.*;
import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.appointment.AppointmentType;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> searchAppointments(
            String query,
            Long doctorId,
            Long patientId,
            Long departmentId,
            AppointmentStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return appointmentRepository.searchAppointments(
                cleanQuery, doctorId, patientId, departmentId, status, startDate, endDate, pageable)
                .map(this::mapToAppointmentResponse);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        return mapToAppointmentResponse(appointment);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentByNumber(String appointmentNumber) {
        Appointment appointment = appointmentRepository.findByAppointmentNumber(appointmentNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "appointmentNumber", appointmentNumber));
        return mapToAppointmentResponse(appointment);
    }

    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        if (patient.getStatus() == PatientStatus.DECEASED) {
            throw new BadRequestException("Cannot book appointment for a deceased patient");
        }

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        if (doctor.getStatus() != DoctorStatus.ACTIVE) {
            throw new BadRequestException("Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + " is currently " + doctor.getStatus());
        }

        Department department = (request.getDepartmentId() != null)
                ? departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()))
                : doctor.getDepartment();

        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Appointment date cannot be in the past");
        }

        if (appointmentRepository.existsConflictingAppointment(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                null)) {
            throw new BadRequestException("Dr. " + doctor.getFirstName() + " already has an active appointment at " + request.getAppointmentTime() + " on " + request.getAppointmentDate());
        }

        int nextQueue = appointmentRepository.findMaxQueueNumber(doctor.getId(), request.getAppointmentDate()) + 1;

        String appointmentNumber = request.getAppointmentNumber();
        if (appointmentNumber != null && !appointmentNumber.trim().isEmpty()) {
            appointmentNumber = appointmentNumber.trim();
            if (appointmentRepository.existsByAppointmentNumber(appointmentNumber)) {
                throw new BadRequestException("Appointment number '" + appointmentNumber + "' already exists");
            }
        } else {
            appointmentNumber = generateUniqueAppointmentNumber();
        }

        Appointment appointment = Appointment.builder()
                .appointmentNumber(appointmentNumber)
                .patient(patient)
                .doctor(doctor)
                .department(department)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .queueNumber(nextQueue)
                .appointmentType(request.getAppointmentType() != null ? request.getAppointmentType() : AppointmentType.CONSULTATION)
                .status(AppointmentStatus.SCHEDULED)
                .reason(request.getReason())
                .notes(request.getNotes())
                .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : doctor.getConsultationFee())
                .bookedBy(currentUser)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        auditLogService.log(
                currentUser,
                "BOOK_APPOINTMENT",
                "Appointment",
                saved.getId().toString(),
                "Booked appointment " + saved.getAppointmentNumber() + " for patient " + patient.getFirstName() + " " + patient.getLastName() + " with Dr. " + doctor.getFirstName() + " on " + saved.getAppointmentDate() + " at " + saved.getAppointmentTime(),
                httpRequest
        );

        return mapToAppointmentResponse(saved);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long id, UpdateAppointmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot update details of a " + appointment.getStatus() + " appointment");
        }

        if (request.getAppointmentType() != null) {
            appointment.setAppointmentType(request.getAppointmentType());
        }
        if (request.getReason() != null) {
            appointment.setReason(request.getReason());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        if (request.getConsultationFee() != null) {
            appointment.setConsultationFee(request.getConsultationFee());
        }

        Appointment updated = appointmentRepository.save(appointment);

        auditLogService.log(
                currentUser,
                "UPDATE_APPOINTMENT",
                "Appointment",
                updated.getId().toString(),
                "Updated appointment details for " + updated.getAppointmentNumber(),
                httpRequest
        );

        return mapToAppointmentResponse(updated);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long id, RescheduleAppointmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot reschedule a cancelled appointment. Please book a new appointment.");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot reschedule an already completed appointment.");
        }

        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("New appointment date cannot be in the past");
        }

        if (appointmentRepository.existsConflictingAppointment(
                appointment.getDoctor().getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                id)) {
            throw new BadRequestException("Dr. " + appointment.getDoctor().getFirstName() + " already has an active appointment at " + request.getAppointmentTime() + " on " + request.getAppointmentDate());
        }

        LocalDate oldDate = appointment.getAppointmentDate();
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());

        if (!oldDate.equals(request.getAppointmentDate())) {
            int newQueue = appointmentRepository.findMaxQueueNumber(appointment.getDoctor().getId(), request.getAppointmentDate()) + 1;
            appointment.setQueueNumber(newQueue);
        }

        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
            String note = "Rescheduled reason: " + request.getReason().trim();
            appointment.setNotes(appointment.getNotes() != null ? (appointment.getNotes() + "\n" + note) : note);
        }

        Appointment updated = appointmentRepository.save(appointment);

        auditLogService.log(
                currentUser,
                "RESCHEDULE_APPOINTMENT",
                "Appointment",
                updated.getId().toString(),
                "Rescheduled appointment " + updated.getAppointmentNumber() + " to " + updated.getAppointmentDate() + " at " + updated.getAppointmentTime(),
                httpRequest
        );

        return mapToAppointmentResponse(updated);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id, CancelAppointmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment is already cancelled");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel an already completed appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(request.getCancellationReason());
        appointment.setCancelledAt(Instant.now());
        appointment.setCancelledBy(currentUser);

        Appointment updated = appointmentRepository.save(appointment);

        auditLogService.log(
                currentUser,
                "CANCEL_APPOINTMENT",
                "Appointment",
                updated.getId().toString(),
                "Cancelled appointment " + updated.getAppointmentNumber() + ". Reason: " + request.getCancellationReason(),
                httpRequest
        );

        return mapToAppointmentResponse(updated);
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long id, AppointmentStatus status, User currentUser, HttpServletRequest httpRequest) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        AppointmentStatus oldStatus = appointment.getStatus();

        if (oldStatus == AppointmentStatus.CANCELLED && status != AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a cancelled appointment");
        }
        if (oldStatus == AppointmentStatus.COMPLETED && status != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot change status of a completed appointment");
        }

        appointment.setStatus(status);
        Appointment updated = appointmentRepository.save(appointment);

        auditLogService.log(
                currentUser,
                "UPDATE_APPOINTMENT_STATUS",
                "Appointment",
                updated.getId().toString(),
                "Changed appointment " + updated.getAppointmentNumber() + " status from " + oldStatus + " to " + status,
                httpRequest
        );

        return mapToAppointmentResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<AppointmentCalendarEventResponse> getCalendarAppointments(Long doctorId, Long departmentId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : start.plusMonths(1).withDayOfMonth(1).minusDays(1);

        return appointmentRepository.findCalendarAppointments(doctorId, departmentId, start, end).stream()
                .map(a -> AppointmentCalendarEventResponse.builder()
                        .id(a.getId())
                        .appointmentNumber(a.getAppointmentNumber())
                        .title("#" + a.getQueueNumber() + " - " + a.getPatient().getFirstName() + " " + a.getPatient().getLastName() + " (Dr. " + a.getDoctor().getLastName() + ")")
                        .appointmentDate(a.getAppointmentDate())
                        .appointmentTime(a.getAppointmentTime())
                        .queueNumber(a.getQueueNumber())
                        .doctorId(a.getDoctor().getId())
                        .doctorName("Dr. " + a.getDoctor().getFirstName() + " " + a.getDoctor().getLastName())
                        .patientId(a.getPatient().getId())
                        .patientName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName())
                        .departmentName(a.getDepartment().getName())
                        .status(a.getStatus())
                        .type(a.getAppointmentType())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentStatsResponse getAppointmentStats() {
        LocalDate today = LocalDate.now();

        long totalAppointments = appointmentRepository.count();
        long todayAppointments = appointmentRepository.countByAppointmentDate(today);
        long todayScheduled = appointmentRepository.countByAppointmentDateAndStatus(today, AppointmentStatus.SCHEDULED);
        long todayConfirmed = appointmentRepository.countByAppointmentDateAndStatus(today, AppointmentStatus.CONFIRMED);
        long todayInProgress = appointmentRepository.countByAppointmentDateAndStatus(today, AppointmentStatus.IN_PROGRESS);
        long todayCompleted = appointmentRepository.countByAppointmentDateAndStatus(today, AppointmentStatus.COMPLETED);
        long todayCancelled = appointmentRepository.countByAppointmentDateAndStatus(today, AppointmentStatus.CANCELLED);
        long upcomingAppointments = appointmentRepository.countByAppointmentDateGreaterThanEqualAndStatusNotIn(
                today,
                Arrays.asList(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)
        );

        Map<String, Long> statusCounts = new HashMap<>();
        for (AppointmentStatus st : AppointmentStatus.values()) {
            statusCounts.put(st.name(), appointmentRepository.countByStatus(st));
        }

        return AppointmentStatsResponse.builder()
                .totalAppointments(totalAppointments)
                .todayAppointments(todayAppointments)
                .todayScheduled(todayScheduled)
                .todayConfirmed(todayConfirmed)
                .todayInProgress(todayInProgress)
                .todayCompleted(todayCompleted)
                .todayCancelled(todayCancelled)
                .upcomingAppointments(upcomingAppointments)
                .statusCounts(statusCounts)
                .build();
    }

    private synchronized String generateUniqueAppointmentNumber() {
        Optional<Appointment> latest = appointmentRepository.findTopByOrderByIdDesc();
        long nextId = latest.map(a -> a.getId() + 1).orElse(1L);
        String candidate = String.format("APT-%05d", nextId);

        while (appointmentRepository.existsByAppointmentNumber(candidate)) {
            nextId++;
            candidate = String.format("APT-%05d", nextId);
        }
        return candidate;
    }

    public AppointmentResponse mapToAppointmentResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .appointmentNumber(a.getAppointmentNumber())
                .patientId(a.getPatient().getId())
                .patientNumber(a.getPatient().getPatientNumber())
                .patientName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName())
                .patientContactNumber(a.getPatient().getContactNumber())
                .doctorId(a.getDoctor().getId())
                .doctorNumber(a.getDoctor().getDoctorNumber())
                .doctorName("Dr. " + a.getDoctor().getFirstName() + " " + a.getDoctor().getLastName())
                .doctorSpecialization(a.getDoctor().getSpecialization())
                .departmentId(a.getDepartment().getId())
                .departmentName(a.getDepartment().getName())
                .departmentCode(a.getDepartment().getCode())
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .queueNumber(a.getQueueNumber())
                .appointmentType(a.getAppointmentType())
                .status(a.getStatus())
                .reason(a.getReason())
                .notes(a.getNotes())
                .consultationFee(a.getConsultationFee())
                .cancellationReason(a.getCancellationReason())
                .cancelledAt(a.getCancelledAt())
                .cancelledById(a.getCancelledBy() != null ? a.getCancelledBy().getId() : null)
                .cancelledByName(a.getCancelledBy() != null ? (a.getCancelledBy().getFirstName() + " " + a.getCancelledBy().getLastName()) : null)
                .bookedById(a.getBookedBy() != null ? a.getBookedBy().getId() : null)
                .bookedByName(a.getBookedBy() != null ? (a.getBookedBy().getFirstName() + " " + a.getBookedBy().getLastName()) : null)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
