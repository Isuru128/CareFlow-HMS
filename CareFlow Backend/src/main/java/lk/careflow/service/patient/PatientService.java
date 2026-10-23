package lk.careflow.service.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.CreatePatientRequest;
import lk.careflow.dto.patient.PatientResponse;
import lk.careflow.dto.patient.PatientStatsResponse;
import lk.careflow.dto.patient.UpdatePatientRequest;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.patient.PatientDocumentRepository;
import lk.careflow.repository.patient.PatientMedicalHistoryRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private static final List<String> VALID_BLOOD_GROUPS = Arrays.asList(
            "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    );

    private final PatientRepository patientRepository;
    private final PatientMedicalHistoryRepository medicalHistoryRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<PatientResponse> searchPatients(String query, PatientStatus status, Gender gender, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return patientRepository.searchPatients(cleanQuery, status, gender, pageable)
                .map(this::mapToPatientResponse);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));
        return mapToPatientResponse(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientByNumber(String patientNumber) {
        Patient patient = patientRepository.findByPatientNumber(patientNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "patientNumber", patientNumber));
        return mapToPatientResponse(patient);
    }

    @Transactional
    public PatientResponse createPatient(CreatePatientRequest request, User currentUser, HttpServletRequest httpRequest) {
        String patientNumber = request.getPatientNumber();
        if (patientNumber != null && !patientNumber.trim().isEmpty()) {
            patientNumber = patientNumber.trim();
            if (patientRepository.existsByPatientNumber(patientNumber)) {
                throw new BadRequestException("Patient number '" + patientNumber + "' is already in use");
            }
        } else {
            patientNumber = generateUniquePatientNumber();
        }

        String normalizedBloodGroup = normalizeAndValidateBloodGroup(request.getBloodGroup());

        Patient patient = Patient.builder()
                .patientNumber(patientNumber)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .bloodGroup(normalizedBloodGroup)
                .contactNumber(request.getContactNumber().trim())
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .nicOrPassport(request.getNicOrPassport() != null && !request.getNicOrPassport().trim().isEmpty() ? request.getNicOrPassport().trim() : null)
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactNumber(request.getEmergencyContactNumber())
                .emergencyContactRelation(request.getEmergencyContactRelation())
                .allergies(request.getAllergies())
                .status(request.getStatus() != null ? request.getStatus() : PatientStatus.ACTIVE)
                .registeredBy(currentUser)
                .build();

        Patient savedPatient = patientRepository.save(patient);

        auditLogService.log(
                currentUser,
                "PATIENT_REGISTERED",
                "PATIENT",
                savedPatient.getId().toString(),
                "Registered new patient: " + savedPatient.getFirstName() + " " + savedPatient.getLastName() +
                        " (" + savedPatient.getPatientNumber() + ")",
                httpRequest
        );

        return mapToPatientResponse(savedPatient);
    }

    @Transactional
    public PatientResponse updatePatient(Long id, UpdatePatientRequest request, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

        String normalizedBloodGroup = normalizeAndValidateBloodGroup(request.getBloodGroup());

        patient.setFirstName(request.getFirstName().trim());
        patient.setLastName(request.getLastName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setBloodGroup(normalizedBloodGroup);
        patient.setContactNumber(request.getContactNumber().trim());
        patient.setEmail(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null);
        patient.setNicOrPassport(request.getNicOrPassport() != null && !request.getNicOrPassport().trim().isEmpty() ? request.getNicOrPassport().trim() : null);
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactNumber(request.getEmergencyContactNumber());
        patient.setEmergencyContactRelation(request.getEmergencyContactRelation());
        patient.setAllergies(request.getAllergies());

        if (request.getStatus() != null) {
            patient.setStatus(request.getStatus());
        }

        Patient updatedPatient = patientRepository.save(patient);

        auditLogService.log(
                currentUser,
                "PATIENT_UPDATED",
                "PATIENT",
                updatedPatient.getId().toString(),
                "Updated details for patient: " + updatedPatient.getPatientNumber(),
                httpRequest
        );

        return mapToPatientResponse(updatedPatient);
    }

    @Transactional
    public void updatePatientStatus(Long id, PatientStatus status, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

        PatientStatus oldStatus = patient.getStatus();
        patient.setStatus(status);
        patientRepository.save(patient);

        auditLogService.log(
                currentUser,
                "PATIENT_STATUS_UPDATED",
                "PATIENT",
                patient.getId().toString(),
                "Changed status of patient " + patient.getPatientNumber() + " from " + oldStatus + " to " + status,
                httpRequest
        );
    }

    @Transactional
    public void deletePatient(Long id, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

        String patientNumber = patient.getPatientNumber();
        String fullName = patient.getFirstName() + " " + patient.getLastName();

        patientRepository.delete(patient);

        auditLogService.log(
                currentUser,
                "PATIENT_DELETED",
                "PATIENT",
                id.toString(),
                "Deleted patient record for " + fullName + " (" + patientNumber + ")",
                httpRequest
        );
    }

    @Transactional(readOnly = true)
    public PatientStatsResponse getPatientStats() {
        long totalPatients = patientRepository.count();
        long activePatients = patientRepository.countByStatus(PatientStatus.ACTIVE);
        long inactivePatients = patientRepository.countByStatus(PatientStatus.INACTIVE);
        long deceasedPatients = patientRepository.countByStatus(PatientStatus.DECEASED);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long newPatientsToday = patientRepository.countByCreatedAtAfter(today.atStartOfDay().toInstant(ZoneOffset.UTC));

        return PatientStatsResponse.builder()
                .totalPatients(totalPatients)
                .activePatients(activePatients)
                .inactivePatients(inactivePatients)
                .deceasedPatients(deceasedPatients)
                .newPatientsToday(newPatientsToday)
                .build();
    }

    private String generateUniquePatientNumber() {
        Optional<Patient> topPatient = patientRepository.findTopByOrderByIdDesc();
        long baseIndex = topPatient.map(p -> p.getId() + 1).orElse(1L);

        long counter = 10000 + baseIndex;
        String candidate = String.format("PAT-%05d", counter);

        while (patientRepository.existsByPatientNumber(candidate)) {
            counter++;
            candidate = String.format("PAT-%05d", counter);
        }

        return candidate;
    }

    private String normalizeAndValidateBloodGroup(String bloodGroup) {
        if (bloodGroup == null || bloodGroup.trim().isEmpty()) {
            return null;
        }
        String normalized = bloodGroup.trim().toUpperCase();
        if (!VALID_BLOOD_GROUPS.contains(normalized)) {
            throw new BadRequestException("Invalid blood group '" + bloodGroup + "'. Allowed values are: " + VALID_BLOOD_GROUPS);
        }
        return normalized;
    }

    private PatientResponse mapToPatientResponse(Patient patient) {
        long totalHistories = medicalHistoryRepository.countByPatientId(patient.getId());
        long totalDocs = patientDocumentRepository.countByPatientId(patient.getId());

        Long registeredById = null;
        String registeredByName = null;
        if (patient.getRegisteredBy() != null) {
            registeredById = patient.getRegisteredBy().getId();
            registeredByName = patient.getRegisteredBy().getFirstName() + " " + patient.getRegisteredBy().getLastName();
        }

        return PatientResponse.builder()
                .id(patient.getId())
                .patientNumber(patient.getPatientNumber())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .contactNumber(patient.getContactNumber())
                .email(patient.getEmail())
                .nicOrPassport(patient.getNicOrPassport())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactNumber(patient.getEmergencyContactNumber())
                .emergencyContactRelation(patient.getEmergencyContactRelation())
                .allergies(patient.getAllergies())
                .status(patient.getStatus())
                .registeredById(registeredById)
                .registeredByName(registeredByName)
                .totalMedicalHistories(totalHistories)
                .totalDocuments(totalDocs)
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}
