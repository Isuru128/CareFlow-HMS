package lk.careflow.controller.doctor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.doctor.*;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.doctor.DoctorService;
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
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<DoctorResponse>> searchDoctors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) DoctorStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(doctorService.searchDoctors(query, departmentId, specialization, status, pageable));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<DoctorSummaryResponse>> getActiveDoctorsSummary() {
        return ResponseEntity.ok(doctorService.getAllActiveDoctorsSummary());
    }

    @GetMapping("/specializations")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<String>> getSpecializations() {
        return ResponseEntity.ok(doctorService.getSpecializations());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<DoctorStatsResponse> getDoctorStats() {
        return ResponseEntity.ok(doctorService.getDoctorStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/number/{doctorNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<DoctorResponse> getDoctorByNumber(@PathVariable String doctorNumber) {
        return ResponseEntity.ok(doctorService.getDoctorByNumber(doctorNumber));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> createDoctor(
            @Valid @RequestBody CreateDoctorRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        DoctorResponse response = doctorService.createDoctor(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(doctorService.updateDoctor(id, request, currentUser, httpRequest));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> updateDoctorStatus(
            @PathVariable Long id,
            @RequestParam DoctorStatus status,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        doctorService.updateDoctorStatus(id, status, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Doctor status updated to " + status.name()));
    }

    @PutMapping("/{id}/department/{departmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> assignDepartment(
            @PathVariable Long id,
            @PathVariable Long departmentId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(doctorService.assignDepartment(id, departmentId, currentUser, httpRequest));
    }
}
