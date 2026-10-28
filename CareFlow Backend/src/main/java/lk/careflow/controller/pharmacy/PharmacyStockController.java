package lk.careflow.controller.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.pharmacy.CreateBatchRequest;
import lk.careflow.dto.pharmacy.MedicineBatchDto;
import lk.careflow.dto.pharmacy.StockAdjustmentRequest;
import lk.careflow.dto.pharmacy.StockTransactionDto;
import lk.careflow.entity.pharmacy.BatchStatus;
import lk.careflow.entity.pharmacy.StockTransactionType;
import lk.careflow.entity.user.User;
import lk.careflow.service.pharmacy.PharmacyStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/pharmacy/stock")
@RequiredArgsConstructor
public class PharmacyStockController {

    private final PharmacyStockService stockService;

    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<MedicineBatchDto>> searchBatches(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) BatchStatus status,
            @PageableDefault(size = 15, sort = "expiryDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(stockService.searchBatches(query, medicineId, status, pageable));
    }

    @GetMapping("/batches/medicine/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineBatchDto>> getBatchesByMedicine(@PathVariable Long medicineId) {
        return ResponseEntity.ok(stockService.getBatchesByMedicine(medicineId));
    }

    @GetMapping("/batches/available/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineBatchDto>> getAvailableBatches(@PathVariable Long medicineId) {
        return ResponseEntity.ok(stockService.getAvailableBatches(medicineId));
    }

    @GetMapping("/batches/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicineBatchDto> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.getBatchById(id));
    }

    @PostMapping("/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineBatchDto> createBatch(
            @Valid @RequestBody CreateBatchRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MedicineBatchDto batch = stockService.createBatch(request, currentUser, httpRequest);
        return new ResponseEntity<>(batch, HttpStatus.CREATED);
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineBatchDto> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(stockService.adjustStock(request, currentUser, httpRequest));
    }

    @PutMapping("/batches/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineBatchDto> updateBatchStatus(
            @PathVariable Long id,
            @RequestParam BatchStatus status,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(stockService.updateBatchStatus(id, status, notes, currentUser, httpRequest));
    }

    @GetMapping("/alerts/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineBatchDto>> getExpiringBatches(
            @RequestParam(defaultValue = "60") int days) {
        return ResponseEntity.ok(stockService.getExpiringBatches(days));
    }

    @GetMapping("/alerts/expired")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineBatchDto>> getExpiredBatches() {
        return ResponseEntity.ok(stockService.getExpiredBatches());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<StockTransactionDto>> searchStockTransactions(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) StockTransactionType transactionType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockService.searchStockTransactions(query, medicineId, transactionType, pageable));
    }
}
