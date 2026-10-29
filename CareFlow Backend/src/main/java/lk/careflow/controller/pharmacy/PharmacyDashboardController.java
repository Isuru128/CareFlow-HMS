package lk.careflow.controller.pharmacy;

import lk.careflow.dto.pharmacy.PharmacyDashboardStatsDto;
import lk.careflow.service.pharmacy.PharmacyDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/pharmacy/dashboard")
@RequiredArgsConstructor
public class PharmacyDashboardController {

    private final PharmacyDashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<PharmacyDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }
}
