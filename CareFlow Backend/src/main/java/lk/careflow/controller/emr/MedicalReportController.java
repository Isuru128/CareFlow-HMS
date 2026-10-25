package lk.careflow.controller.emr;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.emr.CreateMedicalReportRequest;
import lk.careflow.dto.emr.MedicalReportResponse;
import lk.careflow.dto.emr.UpdateMedicalReportRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import lk.careflow.entity.user.User;
import lk.careflow.service.emr.MedicalReportService;
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
@RequestMapping("/api/emr/reports")
@RequiredArgsConstructor
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<MedicalReportResponse>> searchReports(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) ReportType reportType,
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 10, sort = "reportDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(medicalReportService.searchReports(query, patientId, doctorId, reportType, status, pageable));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicalReportResponse>> getReportsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalReportService.getReportsByPatient(patientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicalReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalReportService.getReportById(id));
    }

    @GetMapping("/number/{reportNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicalReportResponse> getReportByNumber(@PathVariable String reportNumber) {
        return ResponseEntity.ok(medicalReportService.getReportByNumber(reportNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MedicalReportResponse> createReport(
            @Valid @RequestBody CreateMedicalReportRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MedicalReportResponse response = medicalReportService.createReport(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MedicalReportResponse> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicalReportRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(medicalReportService.updateReport(id, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        medicalReportService.deleteReport(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Medical report deleted successfully."));
    }
}
