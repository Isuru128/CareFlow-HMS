package lk.careflow.controller.emr;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.*;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.emr.RecordStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/emr")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<MedicalRecordResponse>> searchMedicalRecords(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) RecordStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 10, sort = "visitDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(medicalRecordService.searchMedicalRecords(
                query, patientId, doctorId, status, startDate, endDate, pageable));
    }

    @GetMapping("/records/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicalRecordDetailResponse> getMedicalRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordById(id));
    }

    @GetMapping("/records/number/{recordNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicalRecordDetailResponse> getMedicalRecordByNumber(@PathVariable String recordNumber) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordByNumber(recordNumber));
    }

    @PostMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MedicalRecordDetailResponse> createMedicalRecord(
            @Valid @RequestBody CreateMedicalRecordRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MedicalRecordDetailResponse response = medicalRecordService.createMedicalRecord(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/records/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MedicalRecordDetailResponse> updateMedicalRecord(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicalRecordRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(medicalRecordService.updateMedicalRecord(id, request, currentUser, httpRequest));
    }

    @PutMapping("/records/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MedicalRecordDetailResponse> finalizeMedicalRecord(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(medicalRecordService.finalizeMedicalRecord(id, currentUser, httpRequest));
    }

    @DeleteMapping("/records/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteMedicalRecord(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        medicalRecordService.deleteMedicalRecord(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Medical record deleted successfully."));
    }

    @GetMapping("/patients/{patientId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PatientEmrSummaryResponse> getPatientEmrSummary(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalRecordService.getPatientEmrSummary(patientId));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<EmrStatsResponse> getEmrStats() {
        return ResponseEntity.ok(medicalRecordService.getEmrStats());
    }
}
