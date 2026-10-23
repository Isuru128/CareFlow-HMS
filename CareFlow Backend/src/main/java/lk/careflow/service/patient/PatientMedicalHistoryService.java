package lk.careflow.service.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.CreateMedicalHistoryRequest;
import lk.careflow.dto.patient.MedicalHistoryResponse;
import lk.careflow.dto.patient.UpdateMedicalHistoryRequest;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientMedicalHistory;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.patient.PatientMedicalHistoryRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientMedicalHistoryService {

    private final PatientRepository patientRepository;
    private final PatientMedicalHistoryRepository medicalHistoryRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<MedicalHistoryResponse> getMedicalHistoriesByPatientId(Long patientId) {
        verifyPatientExists(patientId);
        return medicalHistoryRepository.findByPatientIdOrderByDiagnosisDateDescCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicalHistoryResponse getMedicalHistoryById(Long patientId, Long historyId) {
        verifyPatientExists(patientId);
        PatientMedicalHistory history = medicalHistoryRepository.findByIdAndPatientId(historyId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalHistory", "id", historyId));
        return mapToResponse(history);
    }

    @Transactional
    public MedicalHistoryResponse addMedicalHistory(
            Long patientId,
            CreateMedicalHistoryRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        PatientMedicalHistory history = PatientMedicalHistory.builder()
                .patient(patient)
                .conditionOrDiagnosis(request.getConditionOrDiagnosis().trim())
                .diagnosisDate(request.getDiagnosisDate())
                .treatment(request.getTreatment())
                .surgeries(request.getSurgeries())
                .medications(request.getMedications())
                .notes(request.getNotes())
                .recordedBy(currentUser)
                .build();

        PatientMedicalHistory saved = medicalHistoryRepository.save(history);

        auditLogService.log(
                currentUser,
                "MEDICAL_HISTORY_ADDED",
                "PATIENT_MEDICAL_HISTORY",
                saved.getId().toString(),
                "Added medical diagnosis '" + saved.getConditionOrDiagnosis() + "' for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return mapToResponse(saved);
    }

    @Transactional
    public MedicalHistoryResponse updateMedicalHistory(
            Long patientId,
            Long historyId,
            UpdateMedicalHistoryRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        PatientMedicalHistory history = medicalHistoryRepository.findByIdAndPatientId(historyId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalHistory", "id", historyId));

        history.setConditionOrDiagnosis(request.getConditionOrDiagnosis().trim());
        history.setDiagnosisDate(request.getDiagnosisDate());
        history.setTreatment(request.getTreatment());
        history.setSurgeries(request.getSurgeries());
        history.setMedications(request.getMedications());
        history.setNotes(request.getNotes());

        PatientMedicalHistory updated = medicalHistoryRepository.save(history);

        auditLogService.log(
                currentUser,
                "MEDICAL_HISTORY_UPDATED",
                "PATIENT_MEDICAL_HISTORY",
                updated.getId().toString(),
                "Updated medical diagnosis '" + updated.getConditionOrDiagnosis() + "' for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteMedicalHistory(Long patientId, Long historyId, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        PatientMedicalHistory history = medicalHistoryRepository.findByIdAndPatientId(historyId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalHistory", "id", historyId));

        String condition = history.getConditionOrDiagnosis();

        medicalHistoryRepository.delete(history);

        auditLogService.log(
                currentUser,
                "MEDICAL_HISTORY_DELETED",
                "PATIENT_MEDICAL_HISTORY",
                historyId.toString(),
                "Deleted medical diagnosis '" + condition + "' from patient " + patient.getPatientNumber(),
                httpRequest
        );
    }

    private void verifyPatientExists(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient", "id", patientId);
        }
    }

    private MedicalHistoryResponse mapToResponse(PatientMedicalHistory history) {
        Long recordedById = null;
        String recordedByName = null;
        if (history.getRecordedBy() != null) {
            recordedById = history.getRecordedBy().getId();
            recordedByName = history.getRecordedBy().getFirstName() + " " + history.getRecordedBy().getLastName();
        }

        return MedicalHistoryResponse.builder()
                .id(history.getId())
                .patientId(history.getPatient().getId())
                .patientNumber(history.getPatient().getPatientNumber())
                .conditionOrDiagnosis(history.getConditionOrDiagnosis())
                .diagnosisDate(history.getDiagnosisDate())
                .treatment(history.getTreatment())
                .surgeries(history.getSurgeries())
                .medications(history.getMedications())
                .notes(history.getNotes())
                .recordedById(recordedById)
                .recordedByName(recordedByName)
                .createdAt(history.getCreatedAt())
                .updatedAt(history.getUpdatedAt())
                .build();
    }
}
