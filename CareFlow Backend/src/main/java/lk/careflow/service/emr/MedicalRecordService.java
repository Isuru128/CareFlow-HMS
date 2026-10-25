package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.*;
import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.*;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.*;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientDiagnosisRepository patientDiagnosisRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final TreatmentHistoryRepository treatmentHistoryRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<MedicalRecordResponse> searchMedicalRecords(
            String query,
            Long patientId,
            Long doctorId,
            RecordStatus status,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return medicalRecordRepository.searchMedicalRecords(
                cleanQuery, patientId, doctorId, status, startDate, endDate, pageable)
                .map(this::mapToRecordResponse);
    }

    @Transactional(readOnly = true)
    public MedicalRecordDetailResponse getMedicalRecordById(Long id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", id));
        return mapToRecordDetailResponse(record);
    }

    @Transactional(readOnly = true)
    public MedicalRecordDetailResponse getMedicalRecordByNumber(String recordNumber) {
        MedicalRecord record = medicalRecordRepository.findByRecordNumber(recordNumber)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "recordNumber", recordNumber));
        return mapToRecordDetailResponse(record);
    }

    @Transactional
    public MedicalRecordDetailResponse createMedicalRecord(
            CreateMedicalRecordRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
        }

        BigDecimal calculatedBmi = request.getBmi();
        if (calculatedBmi == null && request.getWeightKg() != null && request.getHeightCm() != null && request.getHeightCm().doubleValue() > 0) {
            double heightM = request.getHeightCm().doubleValue() / 100.0;
            double bmiVal = request.getWeightKg().doubleValue() / (heightM * heightM);
            calculatedBmi = BigDecimal.valueOf(bmiVal).setScale(1, RoundingMode.HALF_UP);
        }

        String recordNumber = generateUniqueRecordNumber();

        MedicalRecord record = MedicalRecord.builder()
                .recordNumber(recordNumber)
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .visitDate(request.getVisitDate() != null ? request.getVisitDate() : Instant.now())
                .chiefComplaint(request.getChiefComplaint().trim())
                .examinationNotes(request.getExaminationNotes())
                .clinicalNotes(request.getClinicalNotes())
                .bloodPressure(request.getBloodPressure())
                .temperatureCelsius(request.getTemperatureCelsius())
                .heartRateBpm(request.getHeartRateBpm())
                .respiratoryRateBpm(request.getRespiratoryRateBpm())
                .weightKg(request.getWeightKg())
                .heightCm(request.getHeightCm())
                .bmi(calculatedBmi)
                .oxygenSaturation(request.getOxygenSaturation())
                .status(request.getStatus() != null ? request.getStatus() : RecordStatus.FINALIZED)
                .createdBy(currentUser)
                .build();

        record = medicalRecordRepository.save(record);

        // Save nested diagnoses if present
        if (request.getDiagnoses() != null && !request.getDiagnoses().isEmpty()) {
            for (CreateDiagnosisRequest diagReq : request.getDiagnoses()) {
                PatientDiagnosis diagnosis = PatientDiagnosis.builder()
                        .medicalRecord(record)
                        .patient(patient)
                        .doctor(doctor)
                        .icd10Code(diagReq.getIcd10Code())
                        .diagnosisName(diagReq.getDiagnosisName())
                        .diagnosisType(diagReq.getDiagnosisType() != null ? diagReq.getDiagnosisType() : DiagnosisType.PRIMARY)
                        .status(diagReq.getStatus() != null ? diagReq.getStatus() : DiagnosisStatus.ACTIVE)
                        .severity(diagReq.getSeverity())
                        .diagnosedDate(diagReq.getDiagnosedDate() != null ? diagReq.getDiagnosedDate() : LocalDate.now())
                        .resolvedDate(diagReq.getResolvedDate())
                        .notes(diagReq.getNotes())
                        .build();
                patientDiagnosisRepository.save(diagnosis);
            }
        }

        // Save nested prescription if present
        if (request.getPrescriptionItems() != null && !request.getPrescriptionItems().isEmpty()) {
            String rxNumber = "RX-" + ThreadLocalRandom.current().nextInt(10000, 99999);
            Prescription prescription = Prescription.builder()
                    .prescriptionNumber(rxNumber)
                    .medicalRecord(record)
                    .patient(patient)
                    .doctor(doctor)
                    .issueDate(LocalDate.now())
                    .validUntil(LocalDate.now().plusDays(30))
                    .status(PrescriptionStatus.ACTIVE)
                    .instructions(request.getPrescriptionInstructions())
                    .build();
            prescription = prescriptionRepository.save(prescription);

            for (PrescriptionItemDto itemDto : request.getPrescriptionItems()) {
                PrescriptionItem item = PrescriptionItem.builder()
                        .prescription(prescription)
                        .medicationName(itemDto.getMedicationName())
                        .dosage(itemDto.getDosage())
                        .frequency(itemDto.getFrequency())
                        .route(itemDto.getRoute() != null ? itemDto.getRoute() : MedicationRoute.ORAL)
                        .duration(itemDto.getDuration())
                        .quantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1)
                        .instructions(itemDto.getInstructions())
                        .isDispensed(false)
                        .build();
                prescriptionItemRepository.save(item);
            }
        }

        auditLogService.log(
                currentUser,
                "MEDICAL_RECORD_CREATED",
                "MEDICAL_RECORD",
                String.valueOf(record.getId()),
                "Created EMR record " + record.getRecordNumber() + " for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return mapToRecordDetailResponse(record);
    }

    @Transactional
    public MedicalRecordDetailResponse updateMedicalRecord(
            Long id,
            UpdateMedicalRecordRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", id));

        if (request.getVisitDate() != null) record.setVisitDate(request.getVisitDate());
        record.setChiefComplaint(request.getChiefComplaint().trim());
        record.setExaminationNotes(request.getExaminationNotes());
        record.setClinicalNotes(request.getClinicalNotes());
        record.setBloodPressure(request.getBloodPressure());
        record.setTemperatureCelsius(request.getTemperatureCelsius());
        record.setHeartRateBpm(request.getHeartRateBpm());
        record.setRespiratoryRateBpm(request.getRespiratoryRateBpm());
        record.setWeightKg(request.getWeightKg());
        record.setHeightCm(request.getHeightCm());
        record.setOxygenSaturation(request.getOxygenSaturation());

        BigDecimal calculatedBmi = request.getBmi();
        if (calculatedBmi == null && request.getWeightKg() != null && request.getHeightCm() != null && request.getHeightCm().doubleValue() > 0) {
            double heightM = request.getHeightCm().doubleValue() / 100.0;
            double bmiVal = request.getWeightKg().doubleValue() / (heightM * heightM);
            calculatedBmi = BigDecimal.valueOf(bmiVal).setScale(1, RoundingMode.HALF_UP);
        }
        record.setBmi(calculatedBmi);

        if (request.getStatus() != null) {
            record.setStatus(request.getStatus());
        }

        MedicalRecord saved = medicalRecordRepository.save(record);

        auditLogService.log(
                currentUser,
                "MEDICAL_RECORD_UPDATED",
                "MEDICAL_RECORD",
                String.valueOf(saved.getId()),
                "Updated EMR record " + saved.getRecordNumber(),
                httpRequest
        );

        return mapToRecordDetailResponse(saved);
    }

    @Transactional
    public MedicalRecordDetailResponse finalizeMedicalRecord(
            Long id,
            User currentUser,
            HttpServletRequest httpRequest) {

        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", id));

        record.setStatus(RecordStatus.FINALIZED);
        MedicalRecord saved = medicalRecordRepository.save(record);

        auditLogService.log(
                currentUser,
                "MEDICAL_RECORD_FINALIZED",
                "MEDICAL_RECORD",
                String.valueOf(saved.getId()),
                "Finalized EMR record " + saved.getRecordNumber(),
                httpRequest
        );

        return mapToRecordDetailResponse(saved);
    }

    @Transactional
    public void deleteMedicalRecord(Long id, User currentUser, HttpServletRequest httpRequest) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", id));

        String recordNumber = record.getRecordNumber();
        medicalRecordRepository.delete(record);

        auditLogService.log(
                currentUser,
                "MEDICAL_RECORD_DELETED",
                "MEDICAL_RECORD",
                String.valueOf(id),
                "Deleted EMR record " + recordNumber,
                httpRequest
        );
    }

    @Transactional(readOnly = true)
    public PatientEmrSummaryResponse getPatientEmrSummary(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByVisitDateDesc(patientId);
        List<PatientDiagnosis> diagnoses = patientDiagnosisRepository.findByPatientIdOrderByDiagnosedDateDesc(patientId);
        List<Prescription> prescriptions = prescriptionRepository.findByPatientIdOrderByIssueDateDesc(patientId);
        List<TreatmentHistory> treatments = treatmentHistoryRepository.findByPatientIdOrderByStartDateDesc(patientId);
        List<MedicalReport> reports = medicalReportRepository.findByPatientIdOrderByReportDateDesc(patientId);

        // Calculate Age
        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Latest Vitals from most recent record
        String latestBp = null;
        String latestHr = null;
        String latestTemp = null;
        String latestBmi = null;

        if (!records.isEmpty()) {
            MedicalRecord latest = records.get(0);
            if (latest.getBloodPressure() != null) latestBp = latest.getBloodPressure();
            if (latest.getHeartRateBpm() != null) latestHr = latest.getHeartRateBpm() + " bpm";
            if (latest.getTemperatureCelsius() != null) latestTemp = latest.getTemperatureCelsius() + " °C";
            if (latest.getBmi() != null) latestBmi = latest.getBmi().toString();
        }

        return PatientEmrSummaryResponse.builder()
                .patientId(patient.getId())
                .patientNumber(patient.getPatientNumber())
                .fullName(patient.getFirstName() + " " + patient.getLastName())
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .age(age)
                .contactNumber(patient.getContactNumber())
                .emergencyContact(patient.getEmergencyContactName() != null ?
                        patient.getEmergencyContactName() + " (" + patient.getEmergencyContactNumber() + ")" : null)
                .latestBloodPressure(latestBp)
                .latestHeartRate(latestHr)
                .latestTemperature(latestTemp)
                .latestBmi(latestBmi)
                .recentRecords(records.stream().limit(5).map(this::mapToRecordResponse).collect(Collectors.toList()))
                .activeDiagnoses(diagnoses.stream()
                        .filter(d -> d.getStatus() == DiagnosisStatus.ACTIVE || d.getStatus() == DiagnosisStatus.CHRONIC)
                        .map(this::mapToDiagnosisResponse)
                        .collect(Collectors.toList()))
                .activePrescriptions(prescriptions.stream()
                        .filter(p -> p.getStatus() == PrescriptionStatus.ACTIVE)
                        .map(this::mapToPrescriptionResponse)
                        .collect(Collectors.toList()))
                .activeTreatments(treatments.stream()
                        .filter(t -> t.getStatus() == TreatmentStatus.IN_PROGRESS || t.getStatus() == TreatmentStatus.PLANNED)
                        .map(this::mapToTreatmentResponse)
                        .collect(Collectors.toList()))
                .recentReports(reports.stream().limit(5).map(this::mapToReportResponse).collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public EmrStatsResponse getEmrStats() {
        long totalRecords = medicalRecordRepository.count();
        long draftRecords = medicalRecordRepository.countByStatus(RecordStatus.DRAFT);
        long finalizedRecords = medicalRecordRepository.countByStatus(RecordStatus.FINALIZED);
        long activeDiagnoses = patientDiagnosisRepository.countByStatus(DiagnosisStatus.ACTIVE);
        long activePrescriptions = prescriptionRepository.countByStatus(PrescriptionStatus.ACTIVE);
        long dispensedPrescriptions = prescriptionRepository.countByStatus(PrescriptionStatus.DISPENSED);
        long activeTreatments = treatmentHistoryRepository.countByStatus(TreatmentStatus.IN_PROGRESS);
        long completedTreatments = treatmentHistoryRepository.countByStatus(TreatmentStatus.COMPLETED);
        long totalReports = medicalReportRepository.count();

        return EmrStatsResponse.builder()
                .totalRecords(totalRecords)
                .draftRecords(draftRecords)
                .finalizedRecords(finalizedRecords)
                .activeDiagnoses(activeDiagnoses)
                .activePrescriptions(activePrescriptions)
                .dispensedPrescriptions(dispensedPrescriptions)
                .activeTreatments(activeTreatments)
                .completedTreatments(completedTreatments)
                .totalReports(totalReports)
                .build();
    }

    private String generateUniqueRecordNumber() {
        String recordNumber;
        do {
            recordNumber = String.format("EMR-%05d", ThreadLocalRandom.current().nextInt(10000, 99999));
        } while (medicalRecordRepository.existsByRecordNumber(recordNumber));
        return recordNumber;
    }

    public MedicalRecordResponse mapToRecordResponse(MedicalRecord record) {
        return MedicalRecordResponse.builder()
                .id(record.getId())
                .recordNumber(record.getRecordNumber())
                .patientId(record.getPatient().getId())
                .patientNumber(record.getPatient().getPatientNumber())
                .patientName(record.getPatient().getFirstName() + " " + record.getPatient().getLastName())
                .patientGender(record.getPatient().getGender() != null ? record.getPatient().getGender().name() : null)
                .patientBloodGroup(record.getPatient().getBloodGroup())
                .doctorId(record.getDoctor().getId())
                .doctorNumber(record.getDoctor().getDoctorNumber())
                .doctorName("Dr. " + record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName())
                .doctorSpecialization(record.getDoctor().getSpecialization())
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .appointmentNumber(record.getAppointment() != null ? record.getAppointment().getAppointmentNumber() : null)
                .visitDate(record.getVisitDate())
                .chiefComplaint(record.getChiefComplaint())
                .bloodPressure(record.getBloodPressure())
                .temperatureCelsius(record.getTemperatureCelsius())
                .heartRateBpm(record.getHeartRateBpm())
                .respiratoryRateBpm(record.getRespiratoryRateBpm())
                .weightKg(record.getWeightKg())
                .heightCm(record.getHeightCm())
                .bmi(record.getBmi())
                .oxygenSaturation(record.getOxygenSaturation())
                .status(record.getStatus())
                .diagnosisCount(record.getDiagnoses() != null ? record.getDiagnoses().size() : 0)
                .prescriptionCount(record.getPrescriptions() != null ? record.getPrescriptions().size() : 0)
                .treatmentCount(record.getTreatmentHistories() != null ? record.getTreatmentHistories().size() : 0)
                .reportCount(record.getMedicalReports() != null ? record.getMedicalReports().size() : 0)
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    public MedicalRecordDetailResponse mapToRecordDetailResponse(MedicalRecord record) {
        List<DiagnosisResponse> diagnoses = patientDiagnosisRepository.findByMedicalRecordId(record.getId())
                .stream().map(this::mapToDiagnosisResponse).collect(Collectors.toList());

        List<PrescriptionResponse> prescriptions = prescriptionRepository.findByMedicalRecordId(record.getId())
                .stream().map(this::mapToPrescriptionResponse).collect(Collectors.toList());

        List<TreatmentHistoryResponse> treatments = treatmentHistoryRepository.findByMedicalRecordId(record.getId())
                .stream().map(this::mapToTreatmentResponse).collect(Collectors.toList());

        List<MedicalReportResponse> reports = medicalReportRepository.findByMedicalRecordId(record.getId())
                .stream().map(this::mapToReportResponse).collect(Collectors.toList());

        return MedicalRecordDetailResponse.builder()
                .id(record.getId())
                .recordNumber(record.getRecordNumber())
                .patientId(record.getPatient().getId())
                .patientNumber(record.getPatient().getPatientNumber())
                .patientName(record.getPatient().getFirstName() + " " + record.getPatient().getLastName())
                .patientGender(record.getPatient().getGender() != null ? record.getPatient().getGender().name() : null)
                .patientBloodGroup(record.getPatient().getBloodGroup())
                .patientAllergies(record.getPatient().getAllergies())
                .doctorId(record.getDoctor().getId())
                .doctorNumber(record.getDoctor().getDoctorNumber())
                .doctorName("Dr. " + record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName())
                .doctorSpecialization(record.getDoctor().getSpecialization())
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .appointmentNumber(record.getAppointment() != null ? record.getAppointment().getAppointmentNumber() : null)
                .visitDate(record.getVisitDate())
                .chiefComplaint(record.getChiefComplaint())
                .examinationNotes(record.getExaminationNotes())
                .clinicalNotes(record.getClinicalNotes())
                .bloodPressure(record.getBloodPressure())
                .temperatureCelsius(record.getTemperatureCelsius())
                .heartRateBpm(record.getHeartRateBpm())
                .respiratoryRateBpm(record.getRespiratoryRateBpm())
                .weightKg(record.getWeightKg())
                .heightCm(record.getHeightCm())
                .bmi(record.getBmi())
                .oxygenSaturation(record.getOxygenSaturation())
                .status(record.getStatus())
                .createdByName(record.getCreatedBy() != null ?
                        record.getCreatedBy().getFirstName() + " " + record.getCreatedBy().getLastName() : "System")
                .diagnoses(diagnoses)
                .prescriptions(prescriptions)
                .treatmentHistories(treatments)
                .medicalReports(reports)
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    public DiagnosisResponse mapToDiagnosisResponse(PatientDiagnosis d) {
        return DiagnosisResponse.builder()
                .id(d.getId())
                .medicalRecordId(d.getMedicalRecord() != null ? d.getMedicalRecord().getId() : null)
                .recordNumber(d.getMedicalRecord() != null ? d.getMedicalRecord().getRecordNumber() : null)
                .patientId(d.getPatient().getId())
                .patientNumber(d.getPatient().getPatientNumber())
                .patientName(d.getPatient().getFirstName() + " " + d.getPatient().getLastName())
                .doctorId(d.getDoctor().getId())
                .doctorName("Dr. " + d.getDoctor().getFirstName() + " " + d.getDoctor().getLastName())
                .icd10Code(d.getIcd10Code())
                .diagnosisName(d.getDiagnosisName())
                .diagnosisType(d.getDiagnosisType())
                .status(d.getStatus())
                .severity(d.getSeverity())
                .diagnosedDate(d.getDiagnosedDate())
                .resolvedDate(d.getResolvedDate())
                .notes(d.getNotes())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public PrescriptionResponse mapToPrescriptionResponse(Prescription p) {
        List<PrescriptionItemResponse> items = prescriptionItemRepository.findByPrescriptionId(p.getId())
                .stream().map(item -> PrescriptionItemResponse.builder()
                        .id(item.getId())
                        .prescriptionId(p.getId())
                        .medicationName(item.getMedicationName())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .duration(item.getDuration())
                        .quantity(item.getQuantity())
                        .instructions(item.getInstructions())
                        .isDispensed(item.getIsDispensed())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(p.getId())
                .prescriptionNumber(p.getPrescriptionNumber())
                .medicalRecordId(p.getMedicalRecord() != null ? p.getMedicalRecord().getId() : null)
                .recordNumber(p.getMedicalRecord() != null ? p.getMedicalRecord().getRecordNumber() : null)
                .patientId(p.getPatient().getId())
                .patientNumber(p.getPatient().getPatientNumber())
                .patientName(p.getPatient().getFirstName() + " " + p.getPatient().getLastName())
                .doctorId(p.getDoctor().getId())
                .doctorName("Dr. " + p.getDoctor().getFirstName() + " " + p.getDoctor().getLastName())
                .issueDate(p.getIssueDate())
                .validUntil(p.getValidUntil())
                .status(p.getStatus())
                .instructions(p.getInstructions())
                .notes(p.getNotes())
                .dispensedAt(p.getDispensedAt())
                .items(items)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    public TreatmentHistoryResponse mapToTreatmentResponse(TreatmentHistory t) {
        return TreatmentHistoryResponse.builder()
                .id(t.getId())
                .patientId(t.getPatient().getId())
                .patientNumber(t.getPatient().getPatientNumber())
                .patientName(t.getPatient().getFirstName() + " " + t.getPatient().getLastName())
                .medicalRecordId(t.getMedicalRecord() != null ? t.getMedicalRecord().getId() : null)
                .recordNumber(t.getMedicalRecord() != null ? t.getMedicalRecord().getRecordNumber() : null)
                .doctorId(t.getDoctor() != null ? t.getDoctor().getId() : null)
                .doctorName(t.getDoctor() != null ? "Dr. " + t.getDoctor().getFirstName() + " " + t.getDoctor().getLastName() : "Hospital Staff")
                .treatmentName(t.getTreatmentName())
                .category(t.getCategory())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .status(t.getStatus())
                .outcome(t.getOutcome())
                .procedureNotes(t.getProcedureNotes())
                .complications(t.getComplications())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    public MedicalReportResponse mapToReportResponse(MedicalReport r) {
        return MedicalReportResponse.builder()
                .id(r.getId())
                .reportNumber(r.getReportNumber())
                .medicalRecordId(r.getMedicalRecord() != null ? r.getMedicalRecord().getId() : null)
                .recordNumber(r.getMedicalRecord() != null ? r.getMedicalRecord().getRecordNumber() : null)
                .patientId(r.getPatient().getId())
                .patientNumber(r.getPatient().getPatientNumber())
                .patientName(r.getPatient().getFirstName() + " " + r.getPatient().getLastName())
                .doctorId(r.getDoctor().getId())
                .doctorName("Dr. " + r.getDoctor().getFirstName() + " " + r.getDoctor().getLastName())
                .reportTitle(r.getReportTitle())
                .reportType(r.getReportType())
                .reportDate(r.getReportDate())
                .clinicalFindings(r.getClinicalFindings())
                .recommendations(r.getRecommendations())
                .summary(r.getSummary())
                .attachmentUrl(r.getAttachmentUrl())
                .attachmentName(r.getAttachmentName())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
