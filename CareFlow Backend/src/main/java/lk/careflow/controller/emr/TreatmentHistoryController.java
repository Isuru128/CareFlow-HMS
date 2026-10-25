package lk.careflow.controller.emr;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.CreateTreatmentHistoryRequest;
import lk.careflow.dto.emr.TreatmentHistoryResponse;
import lk.careflow.dto.emr.UpdateTreatmentHistoryRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.emr.TreatmentCategory;
import lk.careflow.entity.emr.TreatmentStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.TreatmentHistoryService;
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
@RequestMapping("/api/emr/treatments")
@RequiredArgsConstructor
public class TreatmentHistoryController {

    private final TreatmentHistoryService treatmentHistoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<TreatmentHistoryResponse>> searchTreatments(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) TreatmentCategory category,
            @RequestParam(required = false) TreatmentStatus status,
            @PageableDefault(size = 10, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(treatmentHistoryService.searchTreatments(query, patientId, category, status, pageable));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<TreatmentHistoryResponse>> getTreatmentsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(treatmentHistoryService.getTreatmentsByPatient(patientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<TreatmentHistoryResponse> getTreatmentById(@PathVariable Long id) {
        return ResponseEntity.ok(treatmentHistoryService.getTreatmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<TreatmentHistoryResponse> addTreatment(
            @Valid @RequestBody CreateTreatmentHistoryRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        TreatmentHistoryResponse response = treatmentHistoryService.addTreatment(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<TreatmentHistoryResponse> updateTreatment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTreatmentHistoryRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(treatmentHistoryService.updateTreatment(id, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteTreatment(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        treatmentHistoryService.deleteTreatment(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Treatment history record deleted successfully."));
    }
}
