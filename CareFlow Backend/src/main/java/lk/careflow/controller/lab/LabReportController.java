package lk.careflow.controller.lab;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.lab.GenerateLabReportRequest;
import lk.careflow.dto.lab.LabReportDetailResponse;
import lk.careflow.dto.lab.LabReportResponse;
import lk.careflow.entity.user.User;
import lk.careflow.service.lab.LabReportService;
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
@RequestMapping("/api/lab/reports")
@RequiredArgsConstructor
public class LabReportController {

    private final LabReportService labReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<LabReportResponse>> searchReports(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10, sort = "reportDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(labReportService.searchReports(query, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabReportDetailResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(labReportService.getReportById(id));
    }

    @GetMapping("/request/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabReportDetailResponse> getReportByRequestId(@PathVariable Long requestId) {
        return ResponseEntity.ok(labReportService.getReportByRequestId(requestId));
    }

    @GetMapping("/number/{reportNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabReportDetailResponse> getReportByNumber(@PathVariable String reportNumber) {
        return ResponseEntity.ok(labReportService.getReportByNumber(reportNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF', 'DOCTOR')")
    public ResponseEntity<LabReportDetailResponse> generateReport(
            @Valid @RequestBody GenerateLabReportRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        LabReportDetailResponse created = labReportService.generateReport(request, currentUser, httpRequest);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF', 'DOCTOR')")
    public ResponseEntity<LabReportDetailResponse> verifyReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(labReportService.verifyReport(id, currentUser, httpRequest));
    }
}
