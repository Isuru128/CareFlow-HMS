package lk.careflow.service.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.pharmacy.CreateBatchRequest;
import lk.careflow.dto.pharmacy.MedicineBatchDto;
import lk.careflow.dto.pharmacy.StockAdjustmentRequest;
import lk.careflow.dto.pharmacy.StockTransactionDto;
import lk.careflow.entity.pharmacy.BatchStatus;
import lk.careflow.entity.pharmacy.Medicine;
import lk.careflow.entity.pharmacy.MedicineBatch;
import lk.careflow.entity.pharmacy.PharmacyStockTransaction;
import lk.careflow.entity.pharmacy.StockTransactionType;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.pharmacy.MedicineBatchRepository;
import lk.careflow.repository.pharmacy.MedicineRepository;
import lk.careflow.repository.pharmacy.PharmacyStockTransactionRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyStockService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final PharmacyStockTransactionRepository stockTransactionRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<MedicineBatchDto> searchBatches(
            String query,
            Long medicineId,
            BatchStatus status,
            Pageable pageable) {
        return medicineBatchRepository.searchBatches(query, medicineId, status, pageable)
                .map(this::mapToBatchDto);
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getBatchesByMedicine(Long medicineId) {
        return medicineBatchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId).stream()
                .map(this::mapToBatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getAvailableBatches(Long medicineId) {
        return medicineBatchRepository.findAvailableBatchesForDispensing(medicineId, LocalDate.now()).stream()
                .map(this::mapToBatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicineBatchDto getBatchById(Long id) {
        MedicineBatch batch = medicineBatchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", id));
        return mapToBatchDto(batch);
    }

    @Transactional
    public MedicineBatchDto createBatch(CreateBatchRequest request, User currentUser, HttpServletRequest httpRequest) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", request.getMedicineId()));

        String batchNumber = request.getBatchNumber().trim();
        if (medicineBatchRepository.existsByMedicineIdAndBatchNumber(medicine.getId(), batchNumber)) {
            throw new BadRequestException("Batch number '" + batchNumber + "' already exists for this medicine");
        }

        if (request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Expiry date cannot be in the past when creating a new batch");
        }

        BigDecimal unitSelling = request.getUnitSellingPrice() != null ? request.getUnitSellingPrice() : medicine.getUnitPrice();
        BigDecimal unitPurchase = request.getUnitPurchasePrice() != null ? request.getUnitPurchasePrice() : BigDecimal.ZERO;

        MedicineBatch batch = MedicineBatch.builder()
                .batchNumber(batchNumber)
                .medicine(medicine)
                .manufactureDate(request.getManufactureDate())
                .expiryDate(request.getExpiryDate())
                .initialQuantity(request.getInitialQuantity())
                .currentQuantity(request.getInitialQuantity())
                .unitPurchasePrice(unitPurchase)
                .unitSellingPrice(unitSelling)
                .supplierName(request.getSupplierName())
                .receivedDate(request.getReceivedDate() != null ? request.getReceivedDate() : LocalDate.now())
                .status(BatchStatus.ACTIVE)
                .notes(request.getNotes())
                .build();

        MedicineBatch saved = medicineBatchRepository.save(batch);

        // Record stock transaction for procurement receipt
        PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                .medicine(medicine)
                .batch(saved)
                .transactionType(StockTransactionType.PURCHASE_RECEIPT)
                .quantity(saved.getInitialQuantity())
                .balanceAfter(saved.getCurrentQuantity())
                .referenceNumber("BATCH-" + saved.getBatchNumber())
                .notes("New procurement stock received. " + (request.getNotes() != null ? request.getNotes() : ""))
                .performedBy(currentUser)
                .build();
        stockTransactionRepository.save(tx);

        auditLogService.log(
                currentUser,
                "BATCH_CREATED",
                "MEDICINE_BATCH",
                String.valueOf(saved.getId()),
                "Received batch " + saved.getBatchNumber() + " with " + saved.getInitialQuantity() + " units for " + medicine.getName(),
                httpRequest
        );

        return mapToBatchDto(saved);
    }

    @Transactional
    public MedicineBatchDto adjustStock(StockAdjustmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        MedicineBatch batch = medicineBatchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", request.getBatchId()));

        int oldQuantity = batch.getCurrentQuantity();
        int newQuantity = oldQuantity + request.getAdjustmentQuantity();

        if (newQuantity < 0) {
            throw new BadRequestException("Adjustment would cause stock to be negative. Current stock is " + oldQuantity);
        }

        batch.setCurrentQuantity(newQuantity);
        if (newQuantity == 0) {
            batch.setStatus(BatchStatus.DEPLETED);
        } else if (batch.getStatus() == BatchStatus.DEPLETED && newQuantity > 0) {
            batch.setStatus(BatchStatus.ACTIVE);
        }

        MedicineBatch saved = medicineBatchRepository.save(batch);

        // Record adjustment transaction
        PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                .medicine(batch.getMedicine())
                .batch(saved)
                .transactionType(StockTransactionType.STOCK_ADJUSTMENT)
                .quantity(request.getAdjustmentQuantity())
                .balanceAfter(newQuantity)
                .referenceNumber("ADJ-" + System.currentTimeMillis() % 100000)
                .notes("Reason: " + request.getReason() + (request.getNotes() != null ? " | Notes: " + request.getNotes() : ""))
                .performedBy(currentUser)
                .build();
        stockTransactionRepository.save(tx);

        auditLogService.log(
                currentUser,
                "STOCK_ADJUSTMENT",
                "MEDICINE_BATCH",
                String.valueOf(saved.getId()),
                "Stock adjusted by " + request.getAdjustmentQuantity() + " units for batch " + saved.getBatchNumber() + " (Reason: " + request.getReason() + ")",
                httpRequest
        );

        return mapToBatchDto(saved);
    }

    @Transactional
    public MedicineBatchDto updateBatchStatus(Long batchId, BatchStatus newStatus, String notes, User currentUser, HttpServletRequest httpRequest) {
        MedicineBatch batch = medicineBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", batchId));

        batch.setStatus(newStatus);
        if (notes != null && !notes.trim().isEmpty()) {
            batch.setNotes((batch.getNotes() != null ? batch.getNotes() + "\n" : "") + notes.trim());
        }

        if (newStatus == BatchStatus.EXPIRED || newStatus == BatchStatus.RECALLED) {
            // Log disposal transaction if remaining quantity is written off
            if (batch.getCurrentQuantity() > 0) {
                PharmacyStockTransaction tx = PharmacyStockTransaction.builder()
                        .medicine(batch.getMedicine())
                        .batch(batch)
                        .transactionType(StockTransactionType.DISPOSAL_EXPIRED)
                        .quantity(-batch.getCurrentQuantity())
                        .balanceAfter(0)
                        .referenceNumber("STATUS-CHG-" + newStatus)
                        .notes("Batch status updated to " + newStatus + ". Stock written off. " + (notes != null ? notes : ""))
                        .performedBy(currentUser)
                        .build();
                stockTransactionRepository.save(tx);
                batch.setCurrentQuantity(0);
            }
        }

        MedicineBatch saved = medicineBatchRepository.save(batch);

        auditLogService.log(
                currentUser,
                "BATCH_STATUS_UPDATED",
                "MEDICINE_BATCH",
                String.valueOf(saved.getId()),
                "Updated status of batch " + saved.getBatchNumber() + " to " + newStatus,
                httpRequest
        );

        return mapToBatchDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getExpiringBatches(int days) {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(days);
        return medicineBatchRepository.findExpiringBatches(today, threshold).stream()
                .map(this::mapToBatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getExpiredBatches() {
        return medicineBatchRepository.findExpiredBatches(LocalDate.now()).stream()
                .map(this::mapToBatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<StockTransactionDto> searchStockTransactions(
            String query,
            Long medicineId,
            StockTransactionType transactionType,
            Pageable pageable) {
        return stockTransactionRepository.searchTransactions(query, medicineId, transactionType, pageable)
                .map(this::mapToTransactionDto);
    }

    public MedicineBatchDto mapToBatchDto(MedicineBatch batch) {
        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
        boolean isExpired = batch.getExpiryDate().isBefore(today) || batch.getExpiryDate().isEqual(today);
        boolean isExpiringSoon = !isExpired && daysUntilExpiry <= 60;

        return MedicineBatchDto.builder()
                .id(batch.getId())
                .batchNumber(batch.getBatchNumber())
                .medicineId(batch.getMedicine().getId())
                .medicineCode(batch.getMedicine().getMedicineCode())
                .medicineName(batch.getMedicine().getName())
                .medicineStrength(batch.getMedicine().getStrength())
                .unitOfMeasure(batch.getMedicine().getUnitOfMeasure())
                .manufactureDate(batch.getManufactureDate())
                .expiryDate(batch.getExpiryDate())
                .initialQuantity(batch.getInitialQuantity())
                .currentQuantity(batch.getCurrentQuantity())
                .unitPurchasePrice(batch.getUnitPurchasePrice())
                .unitSellingPrice(batch.getUnitSellingPrice())
                .supplierName(batch.getSupplierName())
                .receivedDate(batch.getReceivedDate())
                .status(batch.getStatus())
                .notes(batch.getNotes())
                .daysUntilExpiry(daysUntilExpiry)
                .isExpired(isExpired)
                .isExpiringSoon(isExpiringSoon)
                .createdAt(batch.getCreatedAt())
                .build();
    }

    public StockTransactionDto mapToTransactionDto(PharmacyStockTransaction tx) {
        return StockTransactionDto.builder()
                .id(tx.getId())
                .medicineId(tx.getMedicine().getId())
                .medicineCode(tx.getMedicine().getMedicineCode())
                .medicineName(tx.getMedicine().getName())
                .batchId(tx.getBatch() != null ? tx.getBatch().getId() : null)
                .batchNumber(tx.getBatch() != null ? tx.getBatch().getBatchNumber() : null)
                .transactionType(tx.getTransactionType())
                .quantity(tx.getQuantity())
                .balanceAfter(tx.getBalanceAfter())
                .referenceNumber(tx.getReferenceNumber())
                .notes(tx.getNotes())
                .performedByName(tx.getPerformedBy() != null ? tx.getPerformedBy().getFirstName() + " " + tx.getPerformedBy().getLastName() : "System")
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
