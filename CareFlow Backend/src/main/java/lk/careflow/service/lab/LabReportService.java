package lk.careflow.service.lab;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.lab.*;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.lab.*;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.lab.LabReportRepository;
import lk.careflow.repository.lab.LabRequestRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabReportService {

    private final LabReportRepository labReportRepository;
    private final LabRequestRepository labRequestRepository;
    private final LabRequestService labRequestService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<LabReportResponse> searchReports(String query, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return labReportRepository.searchReports(cleanQuery, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public LabReportDetailResponse getReportById(Long id) {
        LabReport report = labReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + id));
        return mapToDetailResponse(report);
    }

    @Transactional(readOnly = true)
    public LabReportDetailResponse getReportByRequestId(Long requestId) {
        LabReport report = labReportRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab report not found for request id: " + requestId));
        return mapToDetailResponse(report);
    }

    @Transactional(readOnly = true)
    public LabReportDetailResponse getReportByNumber(String reportNumber) {
        LabReport report = labReportRepository.findByReportNumber(reportNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with number: " + reportNumber));
        return mapToDetailResponse(report);
    }

    @Transactional
    public LabReportDetailResponse generateReport(
            GenerateLabReportRequest requestDto,
            User currentUser,
            HttpServletRequest httpRequest) {

        LabRequest labRequest = labRequestRepository.findById(requestDto.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + requestDto.getRequestId()));

        if (labRequest.getStatus() == LabRequestStatus.CANCELLED) {
            throw new BadRequestException("Cannot generate report for a cancelled request");
        }

        Optional<LabReport> existingOpt = labReportRepository.findByRequestId(labRequest.getId());
        LabReport report;

        if (existingOpt.isPresent()) {
            report = existingOpt.get();
            report.setSummary(requestDto.getSummary().trim());
            report.setComments(requestDto.getComments());
            if (Boolean.TRUE.equals(requestDto.getFinalizeReport())) {
                report.setStatus(LabReportStatus.FINALIZED);
                report.setVerifiedBy(currentUser);
            }
        } else {
            String reportNumber = generateReportNumber();
            report = LabReport.builder()
                    .reportNumber(reportNumber)
                    .request(labRequest)
                    .generatedBy(currentUser)
                    .verifiedBy(Boolean.TRUE.equals(requestDto.getFinalizeReport()) ? currentUser : null)
                    .reportDate(Instant.now())
                    .summary(requestDto.getSummary().trim())
                    .comments(requestDto.getComments())
                    .status(Boolean.TRUE.equals(requestDto.getFinalizeReport()) ? LabReportStatus.FINALIZED : LabReportStatus.PRELIMINARY)
                    .build();
        }

        LabReport saved = labReportRepository.save(report);

        // Update request status to COMPLETED if not already
        if (labRequest.getStatus() != LabRequestStatus.COMPLETED) {
            labRequest.setStatus(LabRequestStatus.COMPLETED);
            labRequestRepository.save(labRequest);
        }

        auditLogService.log(
                currentUser,
                "GENERATE_LAB_REPORT",
                "LabReport",
                saved.getId().toString(),
                "Generated laboratory report " + saved.getReportNumber() + " (Status: " + saved.getStatus() + ") for request " + labRequest.getRequestNumber(),
                httpRequest
        );

        return mapToDetailResponse(saved);
    }

    @Transactional
    public LabReportDetailResponse verifyReport(
            Long id,
            User currentUser,
            HttpServletRequest httpRequest) {

        LabReport report = labReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab report not found with id: " + id));

        report.setStatus(LabReportStatus.FINALIZED);
        report.setVerifiedBy(currentUser);
        LabReport updated = labReportRepository.save(report);

        auditLogService.log(
                currentUser,
                "VERIFY_LAB_REPORT",
                "LabReport",
                updated.getId().toString(),
                "Verified and finalized laboratory report " + updated.getReportNumber(),
                httpRequest
        );

        return mapToDetailResponse(updated);
    }

    private String generateReportNumber() {
        String candidate;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(10000, 99999);
            candidate = "LRPT-" + randomNum;
        } while (labReportRepository.existsByReportNumber(candidate));
        return candidate;
    }

    public LabReportResponse mapToResponse(LabReport report) {
        LabRequest req = report.getRequest();
        Patient p = req.getPatient();
        Doctor d = req.getDoctor();

        return LabReportResponse.builder()
                .id(report.getId())
                .reportNumber(report.getReportNumber())
                .requestId(req.getId())
                .requestNumber(req.getRequestNumber())
                .patientNumber(p != null ? p.getPatientNumber() : null)
                .patientName(p != null ? p.getFirstName() + " " + p.getLastName() : null)
                .doctorName(d != null ? "Dr. " + d.getFirstName() + " " + d.getLastName() : "Unassigned")
                .generatedByName(report.getGeneratedBy() != null ? report.getGeneratedBy().getFirstName() + " " + report.getGeneratedBy().getLastName() : "Staff")
                .verifiedByName(report.getVerifiedBy() != null ? report.getVerifiedBy().getFirstName() + " " + report.getVerifiedBy().getLastName() : null)
                .reportDate(report.getReportDate())
                .summary(report.getSummary())
                .comments(report.getComments())
                .status(report.getStatus())
                .build();
    }

    public LabReportDetailResponse mapToDetailResponse(LabReport report) {
        LabRequest req = report.getRequest();
        Patient patient = req.getPatient();
        Doctor doctor = req.getDoctor();

        Integer age = null;
        if (patient != null && patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Fetch detailed items
        LabRequestDetailResponse reqDetail = labRequestService.getRequestById(req.getId());

        return LabReportDetailResponse.builder()
                .id(report.getId())
                .reportNumber(report.getReportNumber())
                .requestId(req.getId())
                .requestNumber(req.getRequestNumber())
                .priority(req.getPriority())
                .requestedAt(req.getRequestedAt())
                .patientId(patient != null ? patient.getId() : null)
                .patientNumber(patient != null ? patient.getPatientNumber() : null)
                .patientName(patient != null ? patient.getFirstName() + " " + patient.getLastName() : null)
                .patientGender(patient != null && patient.getGender() != null ? patient.getGender().name() : null)
                .patientAge(age)
                .patientBloodGroup(patient != null ? patient.getBloodGroup() : null)
                .patientContact(patient != null ? patient.getContactNumber() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unassigned")
                .doctorSpecialization(doctor != null ? doctor.getSpecialization() : null)
                .reportDate(report.getReportDate())
                .generatedByName(report.getGeneratedBy() != null ? report.getGeneratedBy().getFirstName() + " " + report.getGeneratedBy().getLastName() : "Staff")
                .verifiedByName(report.getVerifiedBy() != null ? report.getVerifiedBy().getFirstName() + " " + report.getVerifiedBy().getLastName() : null)
                .summary(report.getSummary())
                .comments(report.getComments())
                .status(report.getStatus())
                .items(reqDetail.getItems())
                .samples(reqDetail.getSamples())
                .build();
    }
}
