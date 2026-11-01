package lk.careflow.controller.billing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.billing.AdmissionDto;
import lk.careflow.dto.billing.CreateAdmissionRequest;
import lk.careflow.dto.billing.DischargeAdmissionRequest;
import lk.careflow.entity.billing.AdmissionStatus;
import lk.careflow.entity.billing.RoomType;
import lk.careflow.entity.user.User;
import lk.careflow.service.billing.AdmissionService;
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
@RequestMapping("/api/billing/admissions")
@RequiredArgsConstructor
public class AdmissionController {

    private final AdmissionService admissionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<AdmissionDto>> searchAdmissions(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AdmissionStatus status,
            @RequestParam(required = false) RoomType roomType,
            @PageableDefault(size = 15, sort = "admissionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(admissionService.searchAdmissions(query, patientId, status, roomType, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<AdmissionDto> getAdmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(admissionService.getAdmissionById(id));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<AdmissionDto>> getPatientAdmissions(@PathVariable Long patientId) {
        return ResponseEntity.ok(admissionService.getAdmissionsByPatientId(patientId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<AdmissionDto> createAdmission(
            @Valid @RequestBody CreateAdmissionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        AdmissionDto dto = admissionService.createAdmission(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<AdmissionDto> dischargeAdmission(
            @PathVariable Long id,
            @RequestBody DischargeAdmissionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(admissionService.dischargeAdmission(id, request, currentUser, httpRequest));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<AdmissionDto> cancelAdmission(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Admission cancelled") String reason,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(admissionService.cancelAdmission(id, reason, currentUser, httpRequest));
    }
}

