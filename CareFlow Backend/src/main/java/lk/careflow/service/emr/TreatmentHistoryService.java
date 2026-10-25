package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.CreateTreatmentHistoryRequest;
import lk.careflow.dto.emr.TreatmentHistoryResponse;
import lk.careflow.dto.emr.UpdateTreatmentHistoryRequest;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.emr.TreatmentCategory;
import lk.careflow.entity.emr.TreatmentHistory;
import lk.careflow.entity.emr.TreatmentStatus;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.emr.TreatmentHistoryRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreatmentHistoryService {

    private final TreatmentHistoryRepository treatmentHistoryRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordService medicalRecordService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<TreatmentHistoryResponse> searchTreatments(
            String query,
            Long patientId,
            TreatmentCategory category,
            TreatmentStatus status,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return treatmentHistoryRepository.searchTreatments(cleanQuery, patientId, category, status, pageable)
                .map(medicalRecordService::mapToTreatmentResponse);
    }

    @Transactional(readOnly = true)
    public List<TreatmentHistoryResponse> getTreatmentsByPatient(Long patientId) {
        return treatmentHistoryRepository.findByPatientIdOrderByStartDateDesc(patientId)
                .stream()
                .map(medicalRecordService::mapToTreatmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TreatmentHistoryResponse getTreatmentById(Long id) {
        TreatmentHistory treatment = treatmentHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TreatmentHistory", "id", id));
        return medicalRecordService.mapToTreatmentResponse(treatment);
    }

    @Transactional
    public TreatmentHistoryResponse addTreatment(
            CreateTreatmentHistoryRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
        }

        MedicalRecord record = null;
        if (request.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(request.getMedicalRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", request.getMedicalRecordId()));
        }

        TreatmentHistory treatment = TreatmentHistory.builder()
                .patient(patient)
                .medicalRecord(record)
                .doctor(doctor)
                .treatmentName(request.getTreatmentName().trim())
                .category(request.getCategory() != null ? request.getCategory() : TreatmentCategory.MEDICATION_THERAPY)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : TreatmentStatus.IN_PROGRESS)
                .outcome(request.getOutcome())
                .procedureNotes(request.getProcedureNotes())
                .complications(request.getComplications())
                .build();

        TreatmentHistory saved = treatmentHistoryRepository.save(treatment);

        auditLogService.log(
                currentUser,
                "TREATMENT_HISTORY_ADDED",
                "TREATMENT_HISTORY",
                String.valueOf(saved.getId()),
                "Added treatment: " + saved.getTreatmentName() + " for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return medicalRecordService.mapToTreatmentResponse(saved);
    }

    @Transactional
    public TreatmentHistoryResponse updateTreatment(
            Long id,
            UpdateTreatmentHistoryRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        TreatmentHistory treatment = treatmentHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TreatmentHistory", "id", id));

        if (request.getDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
            treatment.setDoctor(doctor);
        }

        treatment.setTreatmentName(request.getTreatmentName().trim());
        if (request.getCategory() != null) treatment.setCategory(request.getCategory());
        if (request.getStartDate() != null) treatment.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) treatment.setEndDate(request.getEndDate());
        if (request.getStatus() != null) treatment.setStatus(request.getStatus());
        if (request.getOutcome() != null) treatment.setOutcome(request.getOutcome());
        treatment.setProcedureNotes(request.getProcedureNotes());
        treatment.setComplications(request.getComplications());

        TreatmentHistory saved = treatmentHistoryRepository.save(treatment);

        auditLogService.log(
                currentUser,
                "TREATMENT_HISTORY_UPDATED",
                "TREATMENT_HISTORY",
                String.valueOf(saved.getId()),
                "Updated treatment: " + saved.getTreatmentName(),
                httpRequest
        );

        return medicalRecordService.mapToTreatmentResponse(saved);
    }

    @Transactional
    public void deleteTreatment(Long id, User currentUser, HttpServletRequest httpRequest) {
        TreatmentHistory treatment = treatmentHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TreatmentHistory", "id", id));

        treatmentHistoryRepository.delete(treatment);

        auditLogService.log(
                currentUser,
                "TREATMENT_HISTORY_DELETED",
                "TREATMENT_HISTORY",
                String.valueOf(id),
                "Deleted treatment: " + treatment.getTreatmentName(),
                httpRequest
        );
    }
}
