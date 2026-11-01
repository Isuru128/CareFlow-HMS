package lk.careflow.controller.billing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.billing.*;
import lk.careflow.entity.billing.BillingPaymentStatus;
import lk.careflow.entity.billing.InvoiceStatus;
import lk.careflow.entity.billing.PaymentMethod;
import lk.careflow.entity.user.User;
import lk.careflow.service.billing.BillingService;
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
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<BillingDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(billingService.getDashboardStats());
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<BillingInvoiceDto>> searchInvoices(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 15, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(billingService.searchInvoices(query, patientId, status, pageable));
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<BillingInvoiceDto> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getInvoiceById(id));
    }

    @GetMapping("/invoices/number/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<BillingInvoiceDto> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(billingService.getInvoiceByNumber(invoiceNumber));
    }

    @GetMapping("/patients/{patientId}/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<BillingInvoiceDto>> getPatientInvoices(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getPatientInvoices(patientId));
    }

    @GetMapping("/patients/{patientId}/billable-charges")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<PatientBillableChargeDto>> getPatientBillableCharges(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getPatientBillableCharges(patientId));
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')")
    public ResponseEntity<BillingInvoiceDto> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        BillingInvoiceDto dto = billingService.createInvoice(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PostMapping("/invoices/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')")
    public ResponseEntity<BillingInvoiceDto> addInvoiceItem(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceItemRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(billingService.addInvoiceItem(id, request, currentUser, httpRequest));
    }

    @PutMapping("/invoices/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST')")
    public ResponseEntity<BillingInvoiceDto> cancelInvoice(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Cancelled by billing staff") String reason,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(billingService.cancelInvoice(id, reason, currentUser, httpRequest));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<BillingPaymentDto>> searchPayments(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) BillingPaymentStatus status,
            @PageableDefault(size = 15, sort = "paymentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(billingService.searchPayments(query, invoiceId, patientId, paymentMethod, status, pageable));
    }

    @PostMapping("/invoices/{invoiceId}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PHARMACIST')")
    public ResponseEntity<BillingPaymentDto> recordPayment(
            @PathVariable Long invoiceId,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        BillingPaymentDto dto = billingService.recordPayment(invoiceId, request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PutMapping("/payments/{paymentId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BillingPaymentDto> refundPayment(
            @PathVariable Long paymentId,
            @RequestParam(defaultValue = "Refund processed by accounting") String reason,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(billingService.refundPayment(paymentId, reason, currentUser, httpRequest));
    }
}

