package lk.careflow.controller.report;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.report.*;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.report.ReportCategory;
import lk.careflow.entity.report.ReportStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.report.ReportService;
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
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/analytics/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<HospitalAnalyticsOverviewDto> getAnalyticsOverview() {
        return ResponseEntity.ok(reportService.getAnalyticsOverview());
    }

    @GetMapping("/analytics/patients")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PatientReportAnalyticsDto> getPatientReportAnalytics() {
        return ResponseEntity.ok(reportService.getPatientReportAnalytics());
    }

    @GetMapping("/analytics/appointments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<AppointmentReportAnalyticsDto> getAppointmentReportAnalytics() {
        return ResponseEntity.ok(reportService.getAppointmentReportAnalytics());
    }

    @GetMapping("/analytics/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<RevenueReportAnalyticsDto> getRevenueReportAnalytics() {
        return ResponseEntity.ok(reportService.getRevenueReportAnalytics());
    }

    @GetMapping("/analytics/pharmacy")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PharmacyReportAnalyticsDto> getPharmacyReportAnalytics() {
        return ResponseEntity.ok(reportService.getPharmacyReportAnalytics());
    }

    @GetMapping("/analytics/laboratory")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LaboratoryReportAnalyticsDto> getLaboratoryReportAnalytics() {
        return ResponseEntity.ok(reportService.getLaboratoryReportAnalytics());
    }

    @GetMapping("/analytics/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffReportAnalyticsDto> getStaffReportAnalytics() {
        return ResponseEntity.ok(reportService.getStaffReportAnalytics());
    }

    @GetMapping("/saved")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<HospitalReportDto>> searchSavedReports(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ReportCategory category,
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 15, sort = "generatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reportService.searchSavedReports(query, category, status, pageable));
    }

    @GetMapping("/saved/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<HospitalReportDto> getSavedReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getSavedReportById(id));
    }

    @PostMapping("/saved")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<HospitalReportDto> generateAndSaveReport(
            @Valid @RequestBody GenerateReportRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        HospitalReportDto dto = reportService.generateAndSaveReport(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @DeleteMapping("/saved/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<MessageResponse> deleteSavedReport(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        reportService.deleteSavedReport(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Report deleted successfully"));
    }
}

