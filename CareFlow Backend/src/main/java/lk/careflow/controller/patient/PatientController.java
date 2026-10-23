package lk.careflow.controller.patient;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.patient.CreatePatientRequest;
import lk.careflow.dto.patient.PatientResponse;
import lk.careflow.dto.patient.PatientStatsResponse;
import lk.careflow.dto.patient.UpdatePatientRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.patient.PatientService;
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
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<PatientResponse>> searchPatients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) Gender gender,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(patientService.searchPatients(query, status, gender, pageable));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PatientStatsResponse> getPatientStats() {
        return ResponseEntity.ok(patientService.getPatientStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientById(id));
    }

    @GetMapping("/number/{patientNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PatientResponse> getPatientByNumber(@PathVariable String patientNumber) {
        return ResponseEntity.ok(patientService.getPatientByNumber(patientNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR')")
    public ResponseEntity<PatientResponse> createPatient(
            @Valid @RequestBody CreatePatientRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        PatientResponse response = patientService.createPatient(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR')")
    public ResponseEntity<PatientResponse> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePatientRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(patientService.updatePatient(id, request, currentUser, httpRequest));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MessageResponse> updatePatientStatus(
            @PathVariable Long id,
            @RequestParam PatientStatus status,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        patientService.updatePatientStatus(id, status, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Patient status updated to " + status.name()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deletePatient(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        patientService.deletePatient(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Patient deleted successfully"));
    }
}
