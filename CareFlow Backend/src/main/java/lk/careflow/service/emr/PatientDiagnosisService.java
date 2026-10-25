package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.CreateDiagnosisRequest;
import lk.careflow.dto.emr.DiagnosisResponse;
import lk.careflow.dto.emr.UpdateDiagnosisRequest;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.DiagnosisStatus;
import lk.careflow.entity.emr.DiagnosisType;
import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.emr.PatientDiagnosis;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.emr.PatientDiagnosisRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientDiagnosisService {

    private final PatientDiagnosisRepository diagnosisRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordService medicalRecordService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<DiagnosisResponse> searchDiagnoses(
            String query,
            Long patientId,
            DiagnosisStatus status,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return diagnosisRepository.searchDiagnoses(cleanQuery, patientId, status, pageable)
                .map(medicalRecordService::mapToDiagnosisResponse);
    }

    @Transactional(readOnly = true)
    public List<DiagnosisResponse> getDiagnosesByPatient(Long patientId) {
        return diagnosisRepository.findByPatientIdOrderByDiagnosedDateDesc(patientId)
                .stream()
                .map(medicalRecordService::mapToDiagnosisResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiagnosisResponse getDiagnosisById(Long id) {
        PatientDiagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDiagnosis", "id", id));
        return medicalRecordService.mapToDiagnosisResponse(diagnosis);
    }

    @Transactional
    public DiagnosisResponse addDiagnosis(
            CreateDiagnosisRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        MedicalRecord record = null;
        if (request.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(request.getMedicalRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", request.getMedicalRecordId()));
        }

        PatientDiagnosis diagnosis = PatientDiagnosis.builder()
                .medicalRecord(record)
                .patient(patient)
                .doctor(doctor)
                .icd10Code(request.getIcd10Code())
                .diagnosisName(request.getDiagnosisName().trim())
                .diagnosisType(request.getDiagnosisType() != null ? request.getDiagnosisType() : DiagnosisType.PRIMARY)
                .status(request.getStatus() != null ? request.getStatus() : DiagnosisStatus.ACTIVE)
                .severity(request.getSeverity())
                .diagnosedDate(request.getDiagnosedDate() != null ? request.getDiagnosedDate() : LocalDate.now())
                .resolvedDate(request.getResolvedDate())
                .notes(request.getNotes())
                .build();

        PatientDiagnosis saved = diagnosisRepository.save(diagnosis);

        auditLogService.log(
                currentUser,
                "DIAGNOSIS_ADDED",
                "PATIENT_DIAGNOSIS",
                String.valueOf(saved.getId()),
                "Added diagnosis: " + saved.getDiagnosisName() + " for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return medicalRecordService.mapToDiagnosisResponse(saved);
    }

    @Transactional
    public DiagnosisResponse updateDiagnosis(
            Long id,
            UpdateDiagnosisRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        PatientDiagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDiagnosis", "id", id));

        diagnosis.setIcd10Code(request.getIcd10Code());
        diagnosis.setDiagnosisName(request.getDiagnosisName().trim());
        if (request.getDiagnosisType() != null) diagnosis.setDiagnosisType(request.getDiagnosisType());
        if (request.getStatus() != null) diagnosis.setStatus(request.getStatus());
        if (request.getSeverity() != null) diagnosis.setSeverity(request.getSeverity());
        if (request.getDiagnosedDate() != null) diagnosis.setDiagnosedDate(request.getDiagnosedDate());
        if (request.getResolvedDate() != null) diagnosis.setResolvedDate(request.getResolvedDate());
        diagnosis.setNotes(request.getNotes());

        PatientDiagnosis saved = diagnosisRepository.save(diagnosis);

        auditLogService.log(
                currentUser,
                "DIAGNOSIS_UPDATED",
                "PATIENT_DIAGNOSIS",
                String.valueOf(saved.getId()),
                "Updated diagnosis: " + saved.getDiagnosisName(),
                httpRequest
        );

        return medicalRecordService.mapToDiagnosisResponse(saved);
    }

    @Transactional
    public DiagnosisResponse resolveDiagnosis(
            Long id,
            User currentUser,
            HttpServletRequest httpRequest) {

        PatientDiagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDiagnosis", "id", id));

        diagnosis.setStatus(DiagnosisStatus.RESOLVED);
        diagnosis.setResolvedDate(LocalDate.now());

        PatientDiagnosis saved = diagnosisRepository.save(diagnosis);

        auditLogService.log(
                currentUser,
                "DIAGNOSIS_RESOLVED",
                "PATIENT_DIAGNOSIS",
                String.valueOf(saved.getId()),
                "Resolved diagnosis: " + saved.getDiagnosisName(),
                httpRequest
        );

        return medicalRecordService.mapToDiagnosisResponse(saved);
    }

    @Transactional
    public void deleteDiagnosis(Long id, User currentUser, HttpServletRequest httpRequest) {
        PatientDiagnosis diagnosis = diagnosisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDiagnosis", "id", id));

        diagnosisRepository.delete(diagnosis);

        auditLogService.log(
                currentUser,
                "DIAGNOSIS_DELETED",
                "PATIENT_DIAGNOSIS",
                String.valueOf(id),
                "Deleted diagnosis: " + diagnosis.getDiagnosisName(),
                httpRequest
        );
    }
}
