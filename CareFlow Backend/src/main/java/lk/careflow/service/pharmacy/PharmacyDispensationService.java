package lk.careflow.service.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.pharmacy.*;
import lk.careflow.entity.emr.Prescription;
import lk.careflow.entity.emr.PrescriptionItem;
import lk.careflow.entity.emr.PrescriptionStatus;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.pharmacy.*;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.emr.PrescriptionItemRepository;
import lk.careflow.repository.emr.PrescriptionRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.repository.pharmacy.*;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyDispensationService {

    private final PharmacyDispensationRepository dispensationRepository;
    private final PharmacyDispensationItemRepository dispensationItemRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final PharmacyStockTransactionRepository stockTransactionRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PatientRepository patientRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<PharmacyDispensationDto> searchDispensations(
            String query,
            DispensationStatus status,
            PaymentStatus paymentStatus,
            Pageable pageable) {
        return dispensationRepository.searchDispensations(query, status, paymentStatus, pageable)
                .map(this::mapToDispensationDto);
    }

    @Transactional(readOnly = true)
    public PharmacyDispensationDto getDispensationById(Long id) {
        PharmacyDispensation dispensation = dispensationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PharmacyDispensation", "id", id));
        return mapToDispensationDto(dispensation);
    }

    @Transactional(readOnly = true)
    public PharmacyDispensationDto getDispensationByNumber(String dispensationNumber) {
        PharmacyDispensation dispensation = dispensationRepository.findByDispensationNumber(dispensationNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PharmacyDispensation", "number", dispensationNumber));
        return mapToDispensationDto(dispensation);
    }

    @Transactional
    public PharmacyDispensationDto dispensePrescription(
            DispensePrescriptionRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", request.getPrescriptionId()));

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED) {
            throw new BadRequestException("Prescription " + prescription.getPrescriptionNumber() + " is already marked as dispensed");
        }
        if (prescription.getStatus() == PrescriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot dispense a cancelled prescription");
        }

        String dispNumber = generateDispensationNumber();

        Patient patient = prescription.getPatient();
        String patientName = patient != null ? (patient.getFirstName() + " " + patient.getLastName()) : "Unknown Patient";
        String doctorName = prescription.getDoctor() != null ? (prescription.getDoctor().getFirstName() + " " + prescription.getDoctor().getLastName()) : null;

        PharmacyDispensation dispensation = PharmacyDispensation.builder()
                .dispensationNumber(dispNumber)
                .prescription(prescription)
                .patient(patient)
                .patientName(patientName)
                .doctorName(doctorName)
                .dispensedBy(currentUser)
                .dispensedAt(Instant.now())
                .totalAmount(BigDecimal.ZERO)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID)
                .status(DispensationStatus.COMPLETED)
                .notes(request.getNotes())
                .build();

        dispensation = dispensationRepository.save(dispensation);

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PharmacyDispensationItem> dispensationItems = new ArrayList<>();

        for (DispenseItemRequest itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", itemReq.getMedicineId()));

            MedicineBatch batch = resolveBatch(medicine.getId(), itemReq.getBatchId(), itemReq.getQuantity());

            // Deduct stock from the batch
            int remaining = batch.getCurrentQuantity() - itemReq.getQuantity();
            batch.setCurrentQuantity(remaining);
            if (remaining == 0) {
                batch.setStatus(BatchStatus.DEPLETED);
            }
            medicineBatchRepository.save(batch);

            // Record stock transaction
            PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .transactionType(StockTransactionType.DISPENSE)
                    .quantity(-itemReq.getQuantity())
                    .balanceAfter(remaining)
                    .referenceNumber(dispNumber)
                    .notes("Prescription dispense for " + prescription.getPrescriptionNumber())
                    .performedBy(currentUser)
                    .build();
            stockTransactionRepository.save(tx);

            // Calculate subtotal
            BigDecimal unitPrice = batch.getUnitSellingPrice() != null && batch.getUnitSellingPrice().compareTo(BigDecimal.ZERO) > 0
                    ? batch.getUnitSellingPrice()
                    : medicine.getUnitPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            grandTotal = grandTotal.add(subtotal);

            // Link prescription item if provided
            PrescriptionItem prescriptionItem = null;
            if (itemReq.getPrescriptionItemId() != null) {
                prescriptionItem = prescriptionItemRepository.findById(itemReq.getPrescriptionItemId()).orElse(null);
                if (prescriptionItem != null) {
                    prescriptionItem.setIsDispensed(true);
                    prescriptionItemRepository.save(prescriptionItem);
                }
            }

            PharmacyDispensationItem dispItem = PharmacyDispensationItem.builder()
                    .dispensation(dispensation)
                    .medicine(medicine)
                    .batch(batch)
                    .prescriptionItem(prescriptionItem)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .dosageInstructions(itemReq.getDosageInstructions())
                    .build();

            dispensationItems.add(dispensationItemRepository.save(dispItem));
        }

        dispensation.setTotalAmount(grandTotal);
        dispensation.setItems(dispensationItems);
        PharmacyDispensation saved = dispensationRepository.save(dispensation);

        // Update prescription status
        prescription.setStatus(PrescriptionStatus.DISPENSED);
        prescription.setDispensedAt(Instant.now());
        prescriptionRepository.save(prescription);

        auditLogService.log(
                currentUser,
                "PRESCRIPTION_DISPENSED",
                "PHARMACY_DISPENSATION",
                String.valueOf(saved.getId()),
                "Dispensed prescription " + prescription.getPrescriptionNumber() + " (" + dispNumber + ") Total: LKR " + grandTotal,
                httpRequest
        );

        return mapToDispensationDto(saved);
    }

    @Transactional
    public PharmacyDispensationDto processDirectSale(
            DirectSaleRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        String dispNumber = generateDispensationNumber();

        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId()).orElse(null);
        }

        PharmacyDispensation dispensation = PharmacyDispensation.builder()
                .dispensationNumber(dispNumber)
                .prescription(null)
                .patient(patient)
                .patientName(request.getPatientName().trim())
                .doctorName(request.getDoctorName() != null ? request.getDoctorName().trim() : null)
                .dispensedBy(currentUser)
                .dispensedAt(Instant.now())
                .totalAmount(BigDecimal.ZERO)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID)
                .status(DispensationStatus.COMPLETED)
                .notes(request.getNotes())
                .build();

        dispensation = dispensationRepository.save(dispensation);

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PharmacyDispensationItem> dispensationItems = new ArrayList<>();

        for (DirectSaleItemRequest itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", itemReq.getMedicineId()));

            MedicineBatch batch = resolveBatch(medicine.getId(), itemReq.getBatchId(), itemReq.getQuantity());

            // Deduct stock
            int remaining = batch.getCurrentQuantity() - itemReq.getQuantity();
            batch.setCurrentQuantity(remaining);
            if (remaining == 0) {
                batch.setStatus(BatchStatus.DEPLETED);
            }
            medicineBatchRepository.save(batch);

            // Stock transaction
            PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                    .medicine(medicine)
                    .batch(batch)
                    .transactionType(StockTransactionType.DISPENSE)
                    .quantity(-itemReq.getQuantity())
                    .balanceAfter(remaining)
                    .referenceNumber(dispNumber)
                    .notes("Direct / OTC walk-in sale: " + dispNumber)
                    .performedBy(currentUser)
                    .build();
            stockTransactionRepository.save(tx);

            BigDecimal unitPrice = batch.getUnitSellingPrice() != null && batch.getUnitSellingPrice().compareTo(BigDecimal.ZERO) > 0
                    ? batch.getUnitSellingPrice()
                    : medicine.getUnitPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            grandTotal = grandTotal.add(subtotal);

            PharmacyDispensationItem dispItem = PharmacyDispensationItem.builder()
                    .dispensation(dispensation)
                    .medicine(medicine)
                    .batch(batch)
                    .prescriptionItem(null)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .dosageInstructions(itemReq.getDosageInstructions())
                    .build();

            dispensationItems.add(dispensationItemRepository.save(dispItem));
        }

        dispensation.setTotalAmount(grandTotal);
        dispensation.setItems(dispensationItems);
        PharmacyDispensation saved = dispensationRepository.save(dispensation);

        auditLogService.log(
                currentUser,
                "OTC_SALE_COMPLETED",
                "PHARMACY_DISPENSATION",
                String.valueOf(saved.getId()),
                "Completed OTC sale " + dispNumber + " for " + saved.getPatientName() + " (Total: LKR " + grandTotal + ")",
                httpRequest
        );

        return mapToDispensationDto(saved);
    }

    @Transactional
    public PharmacyDispensationDto cancelDispensation(
            Long id,
            String reason,
            User currentUser,
            HttpServletRequest httpRequest) {

        PharmacyDispensation dispensation = dispensationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PharmacyDispensation", "id", id));

        if (dispensation.getStatus() == DispensationStatus.CANCELLED) {
            throw new BadRequestException("Dispensation is already cancelled");
        }

        // Revert stock for each dispensed item
        for (PharmacyDispensationItem item : dispensation.getItems()) {
            if (item.getBatch() != null) {
                MedicineBatch batch = item.getBatch();
                int restoredQuantity = batch.getCurrentQuantity() + item.getQuantity();
                batch.setCurrentQuantity(restoredQuantity);
                if (batch.getStatus() == BatchStatus.DEPLETED && restoredQuantity > 0) {
                    batch.setStatus(BatchStatus.ACTIVE);
                }
                medicineBatchRepository.save(batch);

                // Transaction for stock return
                PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                        .medicine(item.getMedicine())
                        .batch(batch)
                        .transactionType(StockTransactionType.RETURN)
                        .quantity(item.getQuantity())
                        .balanceAfter(restoredQuantity)
                        .referenceNumber("REV-" + dispensation.getDispensationNumber())
                        .notes("Dispensation cancelled. Reason: " + reason)
                        .performedBy(currentUser)
                        .build();
                stockTransactionRepository.save(tx);
            }

            if (item.getPrescriptionItem() != null) {
                PrescriptionItem rxItem = item.getPrescriptionItem();
                rxItem.setIsDispensed(false);
                prescriptionItemRepository.save(rxItem);
            }
        }

        // Revert prescription status if linked
        if (dispensation.getPrescription() != null) {
            Prescription rx = dispensation.getPrescription();
            rx.setStatus(PrescriptionStatus.ACTIVE);
            rx.setDispensedAt(null);
            prescriptionRepository.save(rx);
        }

        dispensation.setStatus(DispensationStatus.CANCELLED);
        dispensation.setNotes((dispensation.getNotes() != null ? dispensation.getNotes() + "\n" : "") + "CANCELLED: " + reason);
        PharmacyDispensation saved = dispensationRepository.save(dispensation);

        auditLogService.log(
                currentUser,
                "DISPENSATION_CANCELLED",
                "PHARMACY_DISPENSATION",
                String.valueOf(saved.getId()),
                "Cancelled dispensation " + saved.getDispensationNumber() + ". Reverted stock. Reason: " + reason,
                httpRequest
        );

        return mapToDispensationDto(saved);
    }

    private MedicineBatch resolveBatch(Long medicineId, Long requestedBatchId, int requiredQuantity) {
        if (requestedBatchId != null) {
            MedicineBatch batch = medicineBatchRepository.findById(requestedBatchId)
                    .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", requestedBatchId));

            if (!batch.getMedicine().getId().equals(medicineId)) {
                throw new BadRequestException("Batch " + batch.getBatchNumber() + " does not belong to the selected medicine");
            }
            if (batch.getStatus() != BatchStatus.ACTIVE) {
                throw new BadRequestException("Batch " + batch.getBatchNumber() + " is not active (Status: " + batch.getStatus() + ")");
            }
            if (batch.getExpiryDate().isBefore(LocalDate.now()) || batch.getExpiryDate().isEqual(LocalDate.now())) {
                throw new BadRequestException("Batch " + batch.getBatchNumber() + " is expired (" + batch.getExpiryDate() + ")");
            }
            if (batch.getCurrentQuantity() < requiredQuantity) {
                throw new BadRequestException("Insufficient quantity in batch " + batch.getBatchNumber() + ". Available: " + batch.getCurrentQuantity() + ", Requested: " + requiredQuantity);
            }
            return batch;
        }

        // Automatic FEFO Allocation (First Expire, First Out)
        List<MedicineBatch> available = medicineBatchRepository.findAvailableBatchesForDispensing(medicineId, LocalDate.now());
        for (MedicineBatch b : available) {
            if (b.getCurrentQuantity() >= requiredQuantity) {
                return b;
            }
        }

        throw new BadRequestException("No single active non-expired batch has sufficient stock (" + requiredQuantity + ") for this medicine.");
    }

    public PharmacyDispensationDto mapToDispensationDto(PharmacyDispensation d) {
        List<PharmacyDispensationItemDto> itemDtos = d.getItems() != null
                ? d.getItems().stream().map(this::mapToItemDto).collect(Collectors.toList())
                : new ArrayList<>();

        return PharmacyDispensationDto.builder()
                .id(d.getId())
                .dispensationNumber(d.getDispensationNumber())
                .prescriptionId(d.getPrescription() != null ? d.getPrescription().getId() : null)
                .prescriptionNumber(d.getPrescription() != null ? d.getPrescription().getPrescriptionNumber() : null)
                .patientId(d.getPatient() != null ? d.getPatient().getId() : null)
                .patientNumber(d.getPatient() != null ? d.getPatient().getPatientNumber() : null)
                .patientName(d.getPatientName())
                .doctorName(d.getDoctorName())
                .dispensedById(d.getDispensedBy() != null ? d.getDispensedBy().getId() : null)
                .dispensedByName(d.getDispensedBy() != null ? d.getDispensedBy().getFirstName() + " " + d.getDispensedBy().getLastName() : "Pharmacist")
                .dispensedAt(d.getDispensedAt())
                .totalAmount(d.getTotalAmount())
                .paymentStatus(d.getPaymentStatus())
                .status(d.getStatus())
                .notes(d.getNotes())
                .createdAt(d.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    public PharmacyDispensationItemDto mapToItemDto(PharmacyDispensationItem item) {
        return PharmacyDispensationItemDto.builder()
                .id(item.getId())
                .medicineId(item.getMedicine().getId())
                .medicineCode(item.getMedicine().getMedicineCode())
                .medicineName(item.getMedicine().getName())
                .medicineStrength(item.getMedicine().getStrength())
                .batchId(item.getBatch() != null ? item.getBatch().getId() : null)
                .batchNumber(item.getBatch() != null ? item.getBatch().getBatchNumber() : null)
                .prescriptionItemId(item.getPrescriptionItem() != null ? item.getPrescriptionItem().getId() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .dosageInstructions(item.getDosageInstructions())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private synchronized String generateDispensationNumber() {
        return dispensationRepository.findTopByOrderByIdDesc()
                .map(d -> String.format("DSP-%05d", d.getId() + 10001))
                .orElse("DSP-10001");
    }
}
