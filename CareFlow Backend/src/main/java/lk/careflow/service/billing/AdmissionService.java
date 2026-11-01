package lk.careflow.service.billing;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.billing.AdmissionDto;
import lk.careflow.dto.billing.CreateAdmissionRequest;
import lk.careflow.dto.billing.DischargeAdmissionRequest;
import lk.careflow.entity.billing.Admission;
import lk.careflow.entity.billing.AdmissionStatus;
import lk.careflow.entity.billing.RoomType;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.billing.AdmissionRepository;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AdmissionDto> searchAdmissions(
            String query,
            Long patientId,
            AdmissionStatus status,
            RoomType roomType,
            Pageable pageable) {
        return admissionRepository.searchAdmissions(query, patientId, status, roomType, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public AdmissionDto getAdmissionById(Long id) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", id));
        return mapToDto(admission);
    }

    @Transactional(readOnly = true)
    public List<AdmissionDto> getAdmissionsByPatientId(Long patientId) {
        return admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdmissionDto createAdmission(
            CreateAdmissionRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        Doctor doctor = null;
        if (request.getAttendingDoctorId() != null) {
            doctor = doctorRepository.findById(request.getAttendingDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getAttendingDoctorId()));
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        } else if (doctor != null) {
            department = doctor.getDepartment();
        }

        String admissionNumber = generateAdmissionNumber();

        Admission admission = Admission.builder()
                .admissionNumber(admissionNumber)
                .patient(patient)
                .attendingDoctor(doctor)
                .department(department)
                .wardName(request.getWardName().trim())
                .roomType(request.getRoomType())
                .bedNumber(request.getBedNumber().trim())
                .admissionDate(request.getAdmissionDate() != null ? request.getAdmissionDate() : Instant.now())
                .dailyRoomRate(request.getDailyRoomRate() != null ? request.getDailyRoomRate() : BigDecimal.ZERO)
                .nursingFeePerDay(request.getNursingFeePerDay() != null ? request.getNursingFeePerDay() : BigDecimal.ZERO)
                .admissionReason(request.getAdmissionReason())
                .status(AdmissionStatus.ADMITTED)
                .admittedBy(currentUser)
                .build();

        Admission saved = admissionRepository.save(admission);

        auditLogService.log(
                currentUser,
                "PATIENT_ADMITTED",
                "ADMISSION",
                String.valueOf(saved.getId()),
                "Admitted patient " + patient.getPatientNumber() + " to " + saved.getWardName() + " Bed " + saved.getBedNumber() + " (" + admissionNumber + ")",
                httpRequest
        );

        return mapToDto(saved);
    }

    @Transactional
    public AdmissionDto dischargeAdmission(
            Long id,
            DischargeAdmissionRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", id));

        if (admission.getStatus() == AdmissionStatus.CANCELLED) {
            throw new BadRequestException("Cannot discharge a cancelled admission");
        }

        Instant dischargeDate = request.getDischargeDate() != null ? request.getDischargeDate() : Instant.now();
        admission.setDischargeDate(dischargeDate);
        admission.setDischargeNotes(request.getDischargeNotes());
        admission.setStatus(request.getStatus() != null ? request.getStatus() : AdmissionStatus.DISCHARGED);

        Admission saved = admissionRepository.save(admission);

        auditLogService.log(
                currentUser,
                "PATIENT_DISCHARGED",
                "ADMISSION",
                String.valueOf(saved.getId()),
                "Discharged admission " + saved.getAdmissionNumber() + " with status " + saved.getStatus(),
                httpRequest
        );

        return mapToDto(saved);
    }

    @Transactional
    public AdmissionDto cancelAdmission(
            Long id,
            String reason,
            User currentUser,
            HttpServletRequest httpRequest) {

        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", id));

        admission.setStatus(AdmissionStatus.CANCELLED);
        admission.setDischargeNotes((admission.getDischargeNotes() != null ? admission.getDischargeNotes() + "\n" : "") + "CANCELLED: " + reason);

        Admission saved = admissionRepository.save(admission);

        auditLogService.log(
                currentUser,
                "ADMISSION_CANCELLED",
                "ADMISSION",
                String.valueOf(saved.getId()),
                "Cancelled admission " + saved.getAdmissionNumber() + ". Reason: " + reason,
                httpRequest
        );

        return mapToDto(saved);
    }

    public int calculateStayDays(Admission a) {
        Instant start = a.getAdmissionDate() != null ? a.getAdmissionDate() : Instant.now();
        Instant end = a.getDischargeDate() != null ? a.getDischargeDate() : Instant.now();
        long hours = ChronoUnit.HOURS.between(start, end);
        int days = (int) Math.ceil(hours / 24.0);
        return Math.max(1, days);
    }

    public AdmissionDto mapToDto(Admission a) {
        int stayDays = calculateStayDays(a);
        BigDecimal dailyRate = (a.getDailyRoomRate() != null ? a.getDailyRoomRate() : BigDecimal.ZERO)
                .add(a.getNursingFeePerDay() != null ? a.getNursingFeePerDay() : BigDecimal.ZERO);
        BigDecimal estimatedTotal = dailyRate.multiply(BigDecimal.valueOf(stayDays));

        return AdmissionDto.builder()
                .id(a.getId())
                .admissionNumber(a.getAdmissionNumber())
                .patientId(a.getPatient().getId())
                .patientNumber(a.getPatient().getPatientNumber())
                .patientName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName())
                .attendingDoctorId(a.getAttendingDoctor() != null ? a.getAttendingDoctor().getId() : null)
                .attendingDoctorName(a.getAttendingDoctor() != null ? a.getAttendingDoctor().getFirstName() + " " + a.getAttendingDoctor().getLastName() : null)
                .departmentId(a.getDepartment() != null ? a.getDepartment().getId() : null)
                .departmentName(a.getDepartment() != null ? a.getDepartment().getName() : null)
                .wardName(a.getWardName())
                .roomType(a.getRoomType())
                .bedNumber(a.getBedNumber())
                .admissionDate(a.getAdmissionDate())
                .dischargeDate(a.getDischargeDate())
                .lengthOfStayDays(stayDays)
                .dailyRoomRate(a.getDailyRoomRate())
                .nursingFeePerDay(a.getNursingFeePerDay())
                .estimatedTotalAdmissionCharge(estimatedTotal)
                .admissionReason(a.getAdmissionReason())
                .dischargeNotes(a.getDischargeNotes())
                .status(a.getStatus())
                .admittedByName(a.getAdmittedBy() != null ? a.getAdmittedBy().getFirstName() + " " + a.getAdmittedBy().getLastName() : "Staff")
                .createdAt(a.getCreatedAt())
                .build();
    }

    private synchronized String generateAdmissionNumber() {
        return admissionRepository.findTopByOrderByIdDesc()
                .map(adm -> String.format("ADM-%05d", adm.getId() + 10001))
                .orElse("ADM-10001");
    }
}

