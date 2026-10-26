package lk.careflow.service.lab;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.lab.*;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.lab.*;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.lab.*;
import lk.careflow.repository.patient.PatientRepository;
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
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabRequestService {

    private final LabRequestRepository labRequestRepository;
    private final LabRequestItemRepository labRequestItemRepository;
    private final LabTestRepository labTestRepository;
    private final LabSampleRepository labSampleRepository;
    private final LabReportRepository labReportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<LabRequestResponse> searchRequests(
            String query,
            Long patientId,
            Long doctorId,
            LabRequestStatus status,
            LabPriority priority,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return labRequestRepository.searchRequests(
                cleanQuery, patientId, doctorId, status, priority, startDate, endDate, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public LabRequestDetailResponse getRequestById(Long id) {
        LabRequest request = labRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + id));
        return mapToDetailResponse(request);
    }

    @Transactional(readOnly = true)
    public LabRequestDetailResponse getRequestByNumber(String requestNumber) {
        LabRequest request = labRequestRepository.findByRequestNumber(requestNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with number: " + requestNumber));
        return mapToDetailResponse(request);
    }

    @Transactional
    public LabRequestDetailResponse createRequest(
            CreateLabRequest requestDto,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(requestDto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + requestDto.getPatientId()));

        Doctor doctor = null;
        if (requestDto.getDoctorId() != null) {
            doctor = doctorRepository.findById(requestDto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + requestDto.getDoctorId()));
        }

        MedicalRecord medicalRecord = null;
        if (requestDto.getMedicalRecordId() != null) {
            medicalRecord = medicalRecordRepository.findById(requestDto.getMedicalRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + requestDto.getMedicalRecordId()));
        }

        List<LabTest> tests = labTestRepository.findAllById(requestDto.getTestIds());
        if (tests.isEmpty()) {
            throw new BadRequestException("No valid laboratory tests selected");
        }

        String requestNumber = generateRequestNumber();

        LabRequest labRequest = LabRequest.builder()
                .requestNumber(requestNumber)
                .patient(patient)
                .doctor(doctor)
                .medicalRecord(medicalRecord)
                .priority(requestDto.getPriority() != null ? requestDto.getPriority() : LabPriority.ROUTINE)
                .status(LabRequestStatus.REQUESTED)
                .clinicalNotes(requestDto.getClinicalNotes())
                .requestedAt(Instant.now())
                .createdBy(currentUser)
                .build();

        for (LabTest test : tests) {
            LabRequestItem item = LabRequestItem.builder()
                    .labTest(test)
                    .status(LabItemStatus.PENDING)
                    .build();
            labRequest.addItem(item);
        }

        LabRequest saved = labRequestRepository.save(labRequest);

        auditLogService.log(
                currentUser,
                "CREATE_LAB_REQUEST",
                "LabRequest",
                saved.getId().toString(),
                "Created test request " + saved.getRequestNumber() + " for patient " + patient.getPatientNumber() + " with " + tests.size() + " test(s)",
                httpRequest
        );

        return mapToDetailResponse(saved);
    }

    @Transactional
    public LabRequestDetailResponse cancelRequest(Long id, String reason, User currentUser, HttpServletRequest httpRequest) {
        LabRequest request = labRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + id));

        if (request.getStatus() == LabRequestStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed lab request");
        }

        request.setStatus(LabRequestStatus.CANCELLED);
        if (request.getItems() != null) {
            for (LabRequestItem item : request.getItems()) {
                item.setStatus(LabItemStatus.CANCELLED);
            }
        }

        String notes = request.getClinicalNotes() != null ? request.getClinicalNotes() + "\n[Cancellation reason: " + reason + "]" : "[Cancellation reason: " + reason + "]";
        request.setClinicalNotes(notes);

        LabRequest updated = labRequestRepository.save(request);

        auditLogService.log(
                currentUser,
                "CANCEL_LAB_REQUEST",
                "LabRequest",
                updated.getId().toString(),
                "Cancelled request " + updated.getRequestNumber() + ". Reason: " + reason,
                httpRequest
        );

        return mapToDetailResponse(updated);
    }

    @Transactional(readOnly = true)
    public LabSummaryStats getSummaryStats() {
        long total = labRequestRepository.count();
        long requested = labRequestRepository.countByStatus(LabRequestStatus.REQUESTED);
        long sampleCollected = labRequestRepository.countByStatus(LabRequestStatus.SAMPLE_COLLECTED);
        long inProgress = labRequestRepository.countByStatus(LabRequestStatus.IN_PROGRESS);
        long completed = labRequestRepository.countByStatus(LabRequestStatus.COMPLETED);
        long urgentActive = labRequestRepository.countUrgentStatActive();
        long totalCatalog = labTestRepository.count();

        return LabSummaryStats.builder()
                .totalRequests(total)
                .requestedCount(requested)
                .sampleCollectedCount(sampleCollected)
                .inProgressCount(inProgress)
                .completedCount(completed)
                .urgentStatCount(urgentActive)
                .totalTestsCatalog(totalCatalog)
                .build();
    }

    private String generateRequestNumber() {
        String candidate;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(10000, 99999);
            candidate = "LRQ-" + randomNum;
        } while (labRequestRepository.existsByRequestNumber(candidate));
        return candidate;
    }

    public LabRequestResponse mapToResponse(LabRequest request) {
        Patient patient = request.getPatient();
        Doctor doctor = request.getDoctor();
        LabReport report = request.getReport();

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        List<String> testNames = new ArrayList<>();
        if (request.getItems() != null) {
            testNames = request.getItems().stream()
                    .map(i -> i.getLabTest().getTestName())
                    .collect(Collectors.toList());
        }

        boolean sampleCollected = request.getSamples() != null && !request.getSamples().isEmpty();

        return LabRequestResponse.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .patientId(patient.getId())
                .patientNumber(patient.getPatientNumber())
                .patientName(patient.getFirstName() + " " + patient.getLastName())
                .patientGender(patient.getGender() != null ? patient.getGender().name() : null)
                .patientAge(age)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unassigned")
                .priority(request.getPriority())
                .status(request.getStatus())
                .clinicalNotes(request.getClinicalNotes())
                .requestedAt(request.getRequestedAt())
                .itemCount(request.getItems() != null ? request.getItems().size() : 0)
                .testNames(testNames)
                .sampleCollected(sampleCollected)
                .hasReport(report != null)
                .reportNumber(report != null ? report.getReportNumber() : null)
                .build();
    }

    public LabRequestDetailResponse mapToDetailResponse(LabRequest request) {
        Patient patient = request.getPatient();
        Doctor doctor = request.getDoctor();
        MedicalRecord mr = request.getMedicalRecord();
        LabReport report = request.getReport();
        User creator = request.getCreatedBy();

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        List<LabRequestItemDto> itemDtos = new ArrayList<>();
        if (request.getItems() != null) {
            itemDtos = request.getItems().stream().map(item -> {
                List<LabResultResponse> resultDtos = new ArrayList<>();
                if (item.getResults() != null) {
                    resultDtos = item.getResults().stream().map(res -> LabResultResponse.builder()
                            .id(res.getId())
                            .requestItemId(item.getId())
                            .parameterName(res.getParameterName())
                            .resultValue(res.getResultValue())
                            .referenceRange(res.getReferenceRange())
                            .unit(res.getUnit())
                            .flag(res.getFlag())
                            .notes(res.getNotes())
                            .enteredByName(res.getEnteredBy() != null ? res.getEnteredBy().getFirstName() + " " + res.getEnteredBy().getLastName() : "Staff")
                            .enteredAt(res.getEnteredAt())
                            .build()
                    ).collect(Collectors.toList());
                }

                return LabRequestItemDto.builder()
                        .id(item.getId())
                        .labTestId(item.getLabTest().getId())
                        .testCode(item.getLabTest().getTestCode())
                        .testName(item.getLabTest().getTestName())
                        .category(item.getLabTest().getCategory().name())
                        .sampleType(item.getLabTest().getSampleType().name())
                        .status(item.getStatus())
                        .notes(item.getNotes())
                        .results(resultDtos)
                        .build();
            }).collect(Collectors.toList());
        }

        List<LabSampleResponse> sampleDtos = new ArrayList<>();
        if (request.getSamples() != null) {
            sampleDtos = request.getSamples().stream().map(sample -> LabSampleResponse.builder()
                    .id(sample.getId())
                    .sampleBarcode(sample.getSampleBarcode())
                    .requestId(request.getId())
                    .requestNumber(request.getRequestNumber())
                    .sampleType(sample.getSampleType())
                    .collectedAt(sample.getCollectedAt())
                    .collectedByName(sample.getCollectedBy() != null ? sample.getCollectedBy().getFirstName() + " " + sample.getCollectedBy().getLastName() : "Lab Staff")
                    .collectionSite(sample.getCollectionSite())
                    .status(sample.getStatus())
                    .rejectionReason(sample.getRejectionReason())
                    .notes(sample.getNotes())
                    .build()
            ).collect(Collectors.toList());
        }

        LabReportResponse reportDto = null;
        if (report != null) {
            reportDto = LabReportResponse.builder()
                    .id(report.getId())
                    .reportNumber(report.getReportNumber())
                    .requestId(request.getId())
                    .requestNumber(request.getRequestNumber())
                    .patientNumber(patient.getPatientNumber())
                    .patientName(patient.getFirstName() + " " + patient.getLastName())
                    .doctorName(doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unassigned")
                    .generatedByName(report.getGeneratedBy() != null ? report.getGeneratedBy().getFirstName() + " " + report.getGeneratedBy().getLastName() : "Staff")
                    .verifiedByName(report.getVerifiedBy() != null ? report.getVerifiedBy().getFirstName() + " " + report.getVerifiedBy().getLastName() : null)
                    .reportDate(report.getReportDate())
                    .summary(report.getSummary())
                    .comments(report.getComments())
                    .status(report.getStatus())
                    .build();
        }

        return LabRequestDetailResponse.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .patientId(patient.getId())
                .patientNumber(patient.getPatientNumber())
                .patientName(patient.getFirstName() + " " + patient.getLastName())
                .patientGender(patient.getGender() != null ? patient.getGender().name() : null)
                .patientContact(patient.getContactNumber())
                .patientAge(age)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unassigned")
                .doctorSpecialization(doctor != null ? doctor.getSpecialization() : null)
                .medicalRecordId(mr != null ? mr.getId() : null)
                .medicalRecordNumber(mr != null ? mr.getRecordNumber() : null)
                .priority(request.getPriority())
                .status(request.getStatus())
                .clinicalNotes(request.getClinicalNotes())
                .requestedAt(request.getRequestedAt())
                .createdByName(creator != null ? creator.getFirstName() + " " + creator.getLastName() : null)
                .items(itemDtos)
                .samples(sampleDtos)
                .report(reportDto)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
