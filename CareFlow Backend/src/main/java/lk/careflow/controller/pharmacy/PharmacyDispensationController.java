package lk.careflow.controller.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.PrescriptionResponse;
import lk.careflow.dto.pharmacy.DirectSaleRequest;
import lk.careflow.dto.pharmacy.DispensePrescriptionRequest;
import lk.careflow.dto.pharmacy.PharmacyDispensationDto;
import lk.careflow.entity.emr.PrescriptionStatus;
import lk.careflow.entity.pharmacy.DispensationStatus;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.PrescriptionService;
import lk.careflow.service.pharmacy.PharmacyDispensationService;
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

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/pharmacy/dispensations")
@RequiredArgsConstructor
public class PharmacyDispensationController {

    private final PharmacyDispensationService dispensationService;
    private final PrescriptionService prescriptionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<PharmacyDispensationDto>> searchDispensations(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) DispensationStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @PageableDefault(size = 15, sort = "dispensedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(dispensationService.searchDispensations(query, status, paymentStatus, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PharmacyDispensationDto> getDispensationById(@PathVariable Long id) {
        return ResponseEntity.ok(dispensationService.getDispensationById(id));
    }

    @GetMapping("/number/{dispNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PharmacyDispensationDto> getDispensationByNumber(@PathVariable String dispNumber) {
        return ResponseEntity.ok(dispensationService.getDispensationByNumber(dispNumber));
    }

    @GetMapping("/pending-prescriptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<PrescriptionResponse>> getPendingPrescriptions(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @PageableDefault(size = 15, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(prescriptionService.searchPrescriptions(query, patientId, doctorId, PrescriptionStatus.ACTIVE, pageable));
    }

    @PostMapping("/dispense-prescription")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<PharmacyDispensationDto> dispensePrescription(
            @Valid @RequestBody DispensePrescriptionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        PharmacyDispensationDto dto = dispensationService.dispensePrescription(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PostMapping("/direct-sale")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<PharmacyDispensationDto> processDirectSale(
            @Valid @RequestBody DirectSaleRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        PharmacyDispensationDto dto = dispensationService.processDirectSale(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<PharmacyDispensationDto> cancelDispensation(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Dispensation cancelled by pharmacist") String reason,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(dispensationService.cancelDispensation(id, reason, currentUser, httpRequest));
    }
}
