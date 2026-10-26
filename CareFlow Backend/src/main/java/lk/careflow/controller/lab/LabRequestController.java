package lk.careflow.controller.lab;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.lab.*;
import lk.careflow.entity.lab.LabPriority;
import lk.careflow.entity.lab.LabRequestStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.lab.LabRequestService;
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
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/lab/requests")
@RequiredArgsConstructor
public class LabRequestController {

    private final LabRequestService labRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<LabRequestResponse>> searchRequests(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) LabRequestStatus status,
            @RequestParam(required = false) LabPriority priority,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 10, sort = "requestedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(labRequestService.searchRequests(
                query, patientId, doctorId, status, priority, startDate, endDate, pageable));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabSummaryStats> getSummaryStats() {
        return ResponseEntity.ok(labRequestService.getSummaryStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabRequestDetailResponse> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(labRequestService.getRequestById(id));
    }

    @GetMapping("/number/{requestNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabRequestDetailResponse> getRequestByNumber(@PathVariable String requestNumber) {
        return ResponseEntity.ok(labRequestService.getRequestByNumber(requestNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<LabRequestDetailResponse> createRequest(
            @Valid @RequestBody CreateLabRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        LabRequestDetailResponse created = labRequestService.createRequest(request, currentUser, httpRequest);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<LabRequestDetailResponse> cancelRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Cancelled by physician";
        return ResponseEntity.ok(labRequestService.cancelRequest(id, reason, currentUser, httpRequest));
    }
}
