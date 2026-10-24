package lk.careflow.service.doctor;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.doctor.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.doctor.DoctorScheduleRepository;
import lk.careflow.repository.user.UserRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<DoctorResponse> searchDoctors(String query, Long departmentId, String specialization, DoctorStatus status, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanSpec = (specialization != null && !specialization.trim().isEmpty()) ? specialization.trim() : null;

        return doctorRepository.searchDoctors(cleanQuery, departmentId, cleanSpec, status, pageable)
                .map(this::mapToDoctorResponse);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        return mapToDoctorResponse(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByNumber(String doctorNumber) {
        Doctor doctor = doctorRepository.findByDoctorNumber(doctorNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "doctorNumber", doctorNumber));
        return mapToDoctorResponse(doctor);
    }

    @Transactional(readOnly = true)
    public List<DoctorSummaryResponse> getAllActiveDoctorsSummary() {
        return doctorRepository.findByStatusOrderByFirstNameAscLastNameAsc(DoctorStatus.ACTIVE).stream()
                .map(d -> DoctorSummaryResponse.builder()
                        .id(d.getId())
                        .doctorNumber(d.getDoctorNumber())
                        .fullName("Dr. " + d.getFirstName() + " " + d.getLastName())
                        .specialization(d.getSpecialization())
                        .departmentId(d.getDepartment().getId())
                        .departmentName(d.getDepartment().getName())
                        .consultationFee(d.getConsultationFee())
                        .status(d.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getSpecializations() {
        return doctorRepository.findDistinctSpecializations();
    }

    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request, User currentUser, HttpServletRequest httpRequest) {
        String licenseNumber = request.getLicenseNumber().trim();
        if (doctorRepository.existsByLicenseNumber(licenseNumber)) {
            throw new BadRequestException("Doctor with license number '" + licenseNumber + "' already exists");
        }

        String doctorNumber = request.getDoctorNumber();
        if (doctorNumber != null && !doctorNumber.trim().isEmpty()) {
            doctorNumber = doctorNumber.trim();
            if (doctorRepository.existsByDoctorNumber(doctorNumber)) {
                throw new BadRequestException("Doctor number '" + doctorNumber + "' is already in use");
            }
        } else {
            doctorNumber = generateUniqueDoctorNumber();
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        User linkedUser = null;
        if (request.getUserId() != null) {
            linkedUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        }

        Doctor doctor = Doctor.builder()
                .doctorNumber(doctorNumber)
                .user(linkedUser)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .specialization(request.getSpecialization().trim())
                .licenseNumber(licenseNumber)
                .department(department)
                .qualification(request.getQualification().trim())
                .experienceYears(request.getExperienceYears())
                .contactNumber(request.getContactNumber().trim())
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .consultationFee(request.getConsultationFee())
                .roomNumber(request.getRoomNumber() != null ? request.getRoomNumber().trim() : null)
                .bio(request.getBio())
                .status(request.getStatus() != null ? request.getStatus() : DoctorStatus.ACTIVE)
                .registeredBy(currentUser)
                .build();

        Doctor saved = doctorRepository.save(doctor);

        auditLogService.log(
                currentUser,
                "CREATE_DOCTOR",
                "Doctor",
                saved.getId().toString(),
                "Registered doctor: " + saved.getDoctorNumber() + " - Dr. " + saved.getFirstName() + " " + saved.getLastName() + " (" + saved.getSpecialization() + ")",
                httpRequest
        );

        return mapToDoctorResponse(saved);
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, UpdateDoctorRequest request, User currentUser, HttpServletRequest httpRequest) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));

        String licenseNumber = request.getLicenseNumber().trim();
        if (!doctor.getLicenseNumber().equalsIgnoreCase(licenseNumber) && doctorRepository.existsByLicenseNumber(licenseNumber)) {
            throw new BadRequestException("Doctor with license number '" + licenseNumber + "' already exists");
        }

        Department department = doctor.getDepartment();
        if (!department.getId().equals(request.getDepartmentId())) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        }

        User linkedUser = doctor.getUser();
        if (request.getUserId() != null && (linkedUser == null || !linkedUser.getId().equals(request.getUserId()))) {
            linkedUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        }

        doctor.setUser(linkedUser);
        doctor.setFirstName(request.getFirstName().trim());
        doctor.setLastName(request.getLastName().trim());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setLicenseNumber(licenseNumber);
        doctor.setDepartment(department);
        doctor.setQualification(request.getQualification().trim());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setContactNumber(request.getContactNumber().trim());
        doctor.setEmail(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null);
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setRoomNumber(request.getRoomNumber() != null ? request.getRoomNumber().trim() : null);
        doctor.setBio(request.getBio());
        if (request.getStatus() != null) {
            doctor.setStatus(request.getStatus());
        }

        Doctor updated = doctorRepository.save(doctor);

        auditLogService.log(
                currentUser,
                "UPDATE_DOCTOR",
                "Doctor",
                updated.getId().toString(),
                "Updated doctor: " + updated.getDoctorNumber() + " - Dr. " + updated.getFirstName() + " " + updated.getLastName(),
                httpRequest
        );

        return mapToDoctorResponse(updated);
    }

    @Transactional
    public void updateDoctorStatus(Long id, DoctorStatus status, User currentUser, HttpServletRequest httpRequest) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));

        DoctorStatus oldStatus = doctor.getStatus();
        doctor.setStatus(status);
        doctorRepository.save(doctor);

        auditLogService.log(
                currentUser,
                "UPDATE_DOCTOR_STATUS",
                "Doctor",
                id.toString(),
                "Changed status for Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + " from " + oldStatus + " to " + status,
                httpRequest
        );
    }

    @Transactional
    public DoctorResponse assignDepartment(Long doctorId, Long departmentId, User currentUser, HttpServletRequest httpRequest) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        String oldDepartmentName = doctor.getDepartment().getName();
        doctor.setDepartment(department);
        Doctor updated = doctorRepository.save(doctor);

        auditLogService.log(
                currentUser,
                "ASSIGN_DEPARTMENT",
                "Doctor",
                doctorId.toString(),
                "Assigned Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + " from " + oldDepartmentName + " to " + department.getName(),
                httpRequest
        );

        return mapToDoctorResponse(updated);
    }

    @Transactional(readOnly = true)
    public DoctorStatsResponse getDoctorStats() {
        long totalDoctors = doctorRepository.count();
        long activeDoctors = doctorRepository.countByStatus(DoctorStatus.ACTIVE);
        long onLeaveDoctors = doctorRepository.countByStatus(DoctorStatus.ON_LEAVE);
        long inactiveDoctors = doctorRepository.countByStatus(DoctorStatus.INACTIVE);
        long totalDepartments = departmentRepository.count();

        List<Doctor> allDoctors = doctorRepository.findAll();
        Map<String, Long> specializationCounts = allDoctors.stream()
                .filter(d -> d.getSpecialization() != null)
                .collect(Collectors.groupingBy(Doctor::getSpecialization, Collectors.counting()));

        return DoctorStatsResponse.builder()
                .totalDoctors(totalDoctors)
                .activeDoctors(activeDoctors)
                .onLeaveDoctors(onLeaveDoctors)
                .inactiveDoctors(inactiveDoctors)
                .totalDepartments(totalDepartments)
                .specializationCounts(specializationCounts)
                .build();
    }

    private synchronized String generateUniqueDoctorNumber() {
        Optional<Doctor> latestDoctor = doctorRepository.findTopByOrderByIdDesc();
        long nextId = latestDoctor.map(d -> d.getId() + 1).orElse(1L);
        String candidateNumber = String.format("DOC-%05d", nextId);

        while (doctorRepository.existsByDoctorNumber(candidateNumber)) {
            nextId++;
            candidateNumber = String.format("DOC-%05d", nextId);
        }
        return candidateNumber;
    }

    public DoctorResponse mapToDoctorResponse(Doctor doctor) {
        long totalAppointments = appointmentRepository.countByDoctorId(doctor.getId());
        List<DoctorScheduleResponse> schedules = scheduleRepository.findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(doctor.getId())
                .stream()
                .map(s -> DoctorScheduleResponse.builder()
                        .id(s.getId())
                        .doctorId(doctor.getId())
                        .doctorName("Dr. " + doctor.getFirstName() + " " + doctor.getLastName())
                        .dayOfWeek(s.getDayOfWeek())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .maxPatients(s.getMaxPatients())
                        .slotDurationMinutes(s.getSlotDurationMinutes())
                        .roomNumber(s.getRoomNumber())
                        .isActive(s.isActive())
                        .build())
                .collect(Collectors.toList());

        return DoctorResponse.builder()
                .id(doctor.getId())
                .doctorNumber(doctor.getDoctorNumber())
                .userId(doctor.getUser() != null ? doctor.getUser().getId() : null)
                .username(doctor.getUser() != null ? doctor.getUser().getUsername() : null)
                .firstName(doctor.getFirstName())
                .lastName(doctor.getLastName())
                .fullName("Dr. " + doctor.getFirstName() + " " + doctor.getLastName())
                .specialization(doctor.getSpecialization())
                .licenseNumber(doctor.getLicenseNumber())
                .departmentId(doctor.getDepartment().getId())
                .departmentName(doctor.getDepartment().getName())
                .departmentCode(doctor.getDepartment().getCode())
                .qualification(doctor.getQualification())
                .experienceYears(doctor.getExperienceYears())
                .contactNumber(doctor.getContactNumber())
                .email(doctor.getEmail())
                .consultationFee(doctor.getConsultationFee())
                .roomNumber(doctor.getRoomNumber())
                .bio(doctor.getBio())
                .status(doctor.getStatus())
                .registeredById(doctor.getRegisteredBy() != null ? doctor.getRegisteredBy().getId() : null)
                .registeredByName(doctor.getRegisteredBy() != null ? (doctor.getRegisteredBy().getFirstName() + " " + doctor.getRegisteredBy().getLastName()) : null)
                .totalAppointments(totalAppointments)
                .schedules(schedules)
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
