package lk.careflow.controller.emr;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.CreateDiagnosisRequest;
import lk.careflow.dto.emr.DiagnosisResponse;
import lk.careflow.dto.emr.UpdateDiagnosisRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.emr.DiagnosisStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.PatientDiagnosisService;
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
@RequestMapping("/api/emr/diagnoses")
@RequiredArgsConstructor
public class PatientDiagnosisController {

    private final PatientDiagnosisService diagnosisService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<DiagnosisResponse>> searchDiagnoses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) DiagnosisStatus status,
            @PageableDefault(size = 10, sort = "diagnosedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(diagnosisService.searchDiagnoses(query, patientId, status, pageable));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<DiagnosisResponse>> getDiagnosesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(diagnosisService.getDiagnosesByPatient(patientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<DiagnosisResponse> getDiagnosisById(@PathVariable Long id) {
        return ResponseEntity.ok(diagnosisService.getDiagnosisById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<DiagnosisResponse> addDiagnosis(
            @Valid @RequestBody CreateDiagnosisRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        DiagnosisResponse response = diagnosisService.addDiagnosis(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<DiagnosisResponse> updateDiagnosis(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiagnosisRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(diagnosisService.updateDiagnosis(id, request, currentUser, httpRequest));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DiagnosisResponse> resolveDiagnosis(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(diagnosisService.resolveDiagnosis(id, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteDiagnosis(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        diagnosisService.deleteDiagnosis(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Diagnosis deleted successfully."));
    }
}
