package lk.careflow.controller.emr;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.CreatePrescriptionRequest;
import lk.careflow.dto.emr.PrescriptionResponse;
import lk.careflow.dto.emr.UpdatePrescriptionRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.emr.PrescriptionStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.PrescriptionService;
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
@RequestMapping("/api/emr/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<PrescriptionResponse>> searchPrescriptions(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) PrescriptionStatus status,
            @PageableDefault(size = 10, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(prescriptionService.searchPrescriptions(query, patientId, doctorId, status, pageable));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(patientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
    }

    @GetMapping("/number/{rxNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PrescriptionResponse> getPrescriptionByNumber(@PathVariable String rxNumber) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionByNumber(rxNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @Valid @RequestBody CreatePrescriptionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        PrescriptionResponse response = prescriptionService.createPrescription(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponse> updatePrescription(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePrescriptionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(prescriptionService.updatePrescription(id, request, currentUser, httpRequest));
    }

    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponse> markAsDispensed(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(prescriptionService.markAsDispensed(id, currentUser, httpRequest));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponse> cancelPrescription(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(prescriptionService.cancelPrescription(id, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deletePrescription(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        prescriptionService.deletePrescription(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Prescription deleted successfully."));
    }
}
