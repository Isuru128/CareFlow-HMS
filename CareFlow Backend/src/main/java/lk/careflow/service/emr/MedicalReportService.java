package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.CreateMedicalReportRequest;
import lk.careflow.dto.emr.MedicalReportResponse;
import lk.careflow.dto.emr.UpdateMedicalReportRequest;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.emr.MedicalReport;
import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.emr.MedicalReportRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordService medicalRecordService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<MedicalReportResponse> searchReports(
            String query,
            Long patientId,
            Long doctorId,
            ReportType reportType,
            ReportStatus status,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return medicalReportRepository.searchReports(cleanQuery, patientId, doctorId, reportType, status, pageable)
                .map(medicalRecordService::mapToReportResponse);
    }

    @Transactional(readOnly = true)
    public List<MedicalReportResponse> getReportsByPatient(Long patientId) {
        return medicalReportRepository.findByPatientIdOrderByReportDateDesc(patientId)
                .stream()
                .map(medicalRecordService::mapToReportResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicalReportResponse getReportById(Long id) {
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalReport", "id", id));
        return medicalRecordService.mapToReportResponse(report);
    }

    @Transactional(readOnly = true)
    public MedicalReportResponse getReportByNumber(String reportNumber) {
        MedicalReport report = medicalReportRepository.findByReportNumber(reportNumber)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalReport", "reportNumber", reportNumber));
        return medicalRecordService.mapToReportResponse(report);
    }

    @Transactional
    public MedicalReportResponse createReport(
            CreateMedicalReportRequest request,
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

        String reportNumber = generateUniqueReportNumber();

        MedicalReport report = MedicalReport.builder()
                .reportNumber(reportNumber)
                .medicalRecord(record)
                .patient(patient)
                .doctor(doctor)
                .reportTitle(request.getReportTitle().trim())
                .reportType(request.getReportType())
                .reportDate(request.getReportDate() != null ? request.getReportDate() : LocalDate.now())
                .clinicalFindings(request.getClinicalFindings().trim())
                .recommendations(request.getRecommendations())
                .summary(request.getSummary())
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentName(request.getAttachmentName())
                .status(request.getStatus() != null ? request.getStatus() : ReportStatus.FINALIZED)
                .build();

        MedicalReport saved = medicalReportRepository.save(report);

        auditLogService.log(
                currentUser,
                "MEDICAL_REPORT_CREATED",
                "MEDICAL_REPORT",
                String.valueOf(saved.getId()),
                "Created report " + saved.getReportNumber() + " for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return medicalRecordService.mapToReportResponse(saved);
    }

    @Transactional
    public MedicalReportResponse updateReport(
            Long id,
            UpdateMedicalReportRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalReport", "id", id));

        report.setReportTitle(request.getReportTitle().trim());
        if (request.getReportType() != null) report.setReportType(request.getReportType());
        if (request.getReportDate() != null) report.setReportDate(request.getReportDate());
        report.setClinicalFindings(request.getClinicalFindings().trim());
        report.setRecommendations(request.getRecommendations());
        report.setSummary(request.getSummary());
        if (request.getAttachmentUrl() != null) report.setAttachmentUrl(request.getAttachmentUrl());
        if (request.getAttachmentName() != null) report.setAttachmentName(request.getAttachmentName());
        if (request.getStatus() != null) report.setStatus(request.getStatus());

        MedicalReport saved = medicalReportRepository.save(report);

        auditLogService.log(
                currentUser,
                "MEDICAL_REPORT_UPDATED",
                "MEDICAL_REPORT",
                String.valueOf(saved.getId()),
                "Updated report " + saved.getReportNumber(),
                httpRequest
        );

        return medicalRecordService.mapToReportResponse(saved);
    }

    @Transactional
    public void deleteReport(Long id, User currentUser, HttpServletRequest httpRequest) {
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalReport", "id", id));

        String reportNumber = report.getReportNumber();
        medicalReportRepository.delete(report);

        auditLogService.log(
                currentUser,
                "MEDICAL_REPORT_DELETED",
                "MEDICAL_REPORT",
                String.valueOf(id),
                "Deleted report " + reportNumber,
                httpRequest
        );
    }

    private String generateUniqueReportNumber() {
        String reportNumber;
        do {
            reportNumber = String.format("REP-%05d", ThreadLocalRandom.current().nextInt(10000, 99999));
        } while (medicalReportRepository.existsByReportNumber(reportNumber));
        return reportNumber;
    }
}
