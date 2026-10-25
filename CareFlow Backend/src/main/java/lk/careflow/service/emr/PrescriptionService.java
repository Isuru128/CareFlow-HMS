package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.CreatePrescriptionRequest;
import lk.careflow.dto.emr.PrescriptionItemDto;
import lk.careflow.dto.emr.PrescriptionResponse;
import lk.careflow.dto.emr.UpdatePrescriptionRequest;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.emr.MedicationRoute;
import lk.careflow.entity.emr.Prescription;
import lk.careflow.entity.emr.PrescriptionItem;
import lk.careflow.entity.emr.PrescriptionStatus;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.emr.PrescriptionItemRepository;
import lk.careflow.repository.emr.PrescriptionRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordService medicalRecordService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> searchPrescriptions(
            String query,
            Long patientId,
            Long doctorId,
            PrescriptionStatus status,
            Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return prescriptionRepository.searchPrescriptions(cleanQuery, patientId, doctorId, status, pageable)
                .map(medicalRecordService::mapToPrescriptionResponse);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByIssueDateDesc(patientId)
                .stream()
                .map(medicalRecordService::mapToPrescriptionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        return medicalRecordService.mapToPrescriptionResponse(prescription);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionByNumber(String rxNumber) {
        Prescription prescription = prescriptionRepository.findByPrescriptionNumber(rxNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "prescriptionNumber", rxNumber));
        return medicalRecordService.mapToPrescriptionResponse(prescription);
    }

    @Transactional
    public PrescriptionResponse createPrescription(
            CreatePrescriptionRequest request,
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

        String rxNumber = generateUniquePrescriptionNumber();

        Prescription prescription = Prescription.builder()
                .prescriptionNumber(rxNumber)
                .medicalRecord(record)
                .patient(patient)
                .doctor(doctor)
                .issueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now())
                .validUntil(request.getValidUntil() != null ? request.getValidUntil() : LocalDate.now().plusDays(30))
                .status(request.getStatus() != null ? request.getStatus() : PrescriptionStatus.ACTIVE)
                .instructions(request.getInstructions())
                .notes(request.getNotes())
                .build();

        prescription = prescriptionRepository.save(prescription);

        if (request.getItems() != null) {
            for (PrescriptionItemDto itemDto : request.getItems()) {
                PrescriptionItem item = PrescriptionItem.builder()
                        .prescription(prescription)
                        .medicationName(itemDto.getMedicationName())
                        .dosage(itemDto.getDosage())
                        .frequency(itemDto.getFrequency())
                        .route(itemDto.getRoute() != null ? itemDto.getRoute() : MedicationRoute.ORAL)
                        .duration(itemDto.getDuration())
                        .quantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1)
                        .instructions(itemDto.getInstructions())
                        .isDispensed(itemDto.getIsDispensed() != null ? itemDto.getIsDispensed() : false)
                        .build();
                prescriptionItemRepository.save(item);
            }
        }

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_CREATED",
                "PRESCRIPTION",
                String.valueOf(prescription.getId()),
                "Created prescription " + prescription.getPrescriptionNumber() + " for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return medicalRecordService.mapToPrescriptionResponse(prescription);
    }

    @Transactional
    public PrescriptionResponse updatePrescription(
            Long id,
            UpdatePrescriptionRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        if (request.getValidUntil() != null) prescription.setValidUntil(request.getValidUntil());
        if (request.getStatus() != null) prescription.setStatus(request.getStatus());
        prescription.setInstructions(request.getInstructions());
        prescription.setNotes(request.getNotes());

        if (request.getItems() != null) {
            // Remove existing items and replace
            prescriptionItemRepository.deleteAll(prescription.getItems());
            prescription.getItems().clear();

            for (PrescriptionItemDto itemDto : request.getItems()) {
                PrescriptionItem item = PrescriptionItem.builder()
                        .prescription(prescription)
                        .medicationName(itemDto.getMedicationName())
                        .dosage(itemDto.getDosage())
                        .frequency(itemDto.getFrequency())
                        .route(itemDto.getRoute() != null ? itemDto.getRoute() : MedicationRoute.ORAL)
                        .duration(itemDto.getDuration())
                        .quantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1)
                        .instructions(itemDto.getInstructions())
                        .isDispensed(itemDto.getIsDispensed() != null ? itemDto.getIsDispensed() : false)
                        .build();
                prescriptionItemRepository.save(item);
            }
        }

        Prescription saved = prescriptionRepository.save(prescription);

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_UPDATED",
                "PRESCRIPTION",
                String.valueOf(saved.getId()),
                "Updated prescription " + saved.getPrescriptionNumber(),
                httpRequest
        );

        return medicalRecordService.mapToPrescriptionResponse(saved);
    }

    @Transactional
    public PrescriptionResponse markAsDispensed(
            Long id,
            User currentUser,
            HttpServletRequest httpRequest) {

        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        prescription.setStatus(PrescriptionStatus.DISPENSED);
        prescription.setDispensedAt(Instant.now());

        // Mark all items dispensed
        List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionId(id);
        for (PrescriptionItem item : items) {
            item.setIsDispensed(true);
            prescriptionItemRepository.save(item);
        }

        Prescription saved = prescriptionRepository.save(prescription);

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_DISPENSED",
                "PRESCRIPTION",
                String.valueOf(saved.getId()),
                "Dispensed prescription " + saved.getPrescriptionNumber(),
                httpRequest
        );

        return medicalRecordService.mapToPrescriptionResponse(saved);
    }

    @Transactional
    public PrescriptionResponse cancelPrescription(
            Long id,
            User currentUser,
            HttpServletRequest httpRequest) {

        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        prescription.setStatus(PrescriptionStatus.CANCELLED);
        Prescription saved = prescriptionRepository.save(prescription);

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_CANCELLED",
                "PRESCRIPTION",
                String.valueOf(saved.getId()),
                "Cancelled prescription " + saved.getPrescriptionNumber(),
                httpRequest
        );

        return medicalRecordService.mapToPrescriptionResponse(saved);
    }

    @Transactional
    public void deletePrescription(Long id, User currentUser, HttpServletRequest httpRequest) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        prescriptionRepository.delete(prescription);

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_DELETED",
                "PRESCRIPTION",
                String.valueOf(id),
                "Deleted prescription " + prescription.getPrescriptionNumber(),
                httpRequest
        );
    }

    private String generateUniquePrescriptionNumber() {
        String rxNumber;
        do {
            rxNumber = String.format("RX-%05d", ThreadLocalRandom.current().nextInt(10000, 99999));
        } while (prescriptionRepository.existsByPrescriptionNumber(rxNumber));
        return rxNumber;
    }
}
