package lk.careflow.controller.patient;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.patient.CreateMedicalHistoryRequest;
import lk.careflow.dto.patient.MedicalHistoryResponse;
import lk.careflow.dto.patient.UpdateMedicalHistoryRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.user.User;
import lk.careflow.service.patient.PatientMedicalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/patients/{patientId}/medical-history")
@RequiredArgsConstructor
public class PatientMedicalHistoryController {

    private final PatientMedicalHistoryService medicalHistoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<List<MedicalHistoryResponse>> getMedicalHistories(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalHistoryService.getMedicalHistoriesByPatientId(patientId));
    }

    @GetMapping("/{historyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MedicalHistoryResponse> getMedicalHistoryById(
            @PathVariable Long patientId,
            @PathVariable Long historyId) {
        return ResponseEntity.ok(medicalHistoryService.getMedicalHistoryById(patientId, historyId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MedicalHistoryResponse> addMedicalHistory(
            @PathVariable Long patientId,
            @Valid @RequestBody CreateMedicalHistoryRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MedicalHistoryResponse response = medicalHistoryService.addMedicalHistory(patientId, request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{historyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MedicalHistoryResponse> updateMedicalHistory(
            @PathVariable Long patientId,
            @PathVariable Long historyId,
            @Valid @RequestBody UpdateMedicalHistoryRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(medicalHistoryService.updateMedicalHistory(patientId, historyId, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{historyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<MessageResponse> deleteMedicalHistory(
            @PathVariable Long patientId,
            @PathVariable Long historyId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        medicalHistoryService.deleteMedicalHistory(patientId, historyId, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Medical history record deleted successfully"));
    }
}
