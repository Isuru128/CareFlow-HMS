package lk.careflow.controller.lab;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.lab.CollectSampleRequest;
import lk.careflow.dto.lab.LabSampleResponse;
import lk.careflow.dto.lab.UpdateSampleStatusRequest;
import lk.careflow.entity.lab.SampleStatus;
import lk.careflow.entity.user.User;
import lk.careflow.service.lab.LabSampleService;
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
@RequestMapping("/api/lab/samples")
@RequiredArgsConstructor
public class LabSampleController {

    private final LabSampleService labSampleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<LabSampleResponse>> searchSamples(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) SampleStatus status,
            @PageableDefault(size = 15, sort = "collectedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(labSampleService.searchSamples(query, status, pageable));
    }

    @GetMapping("/request/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<LabSampleResponse>> getSamplesByRequestId(@PathVariable Long requestId) {
        return ResponseEntity.ok(labSampleService.getSamplesByRequestId(requestId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabSampleResponse> getSampleById(@PathVariable Long id) {
        return ResponseEntity.ok(labSampleService.getSampleById(id));
    }

    @GetMapping("/barcode/{barcode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabSampleResponse> getSampleByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(labSampleService.getSampleByBarcode(barcode));
    }

    @PostMapping("/collect")
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF', 'NURSE')")
    public ResponseEntity<LabSampleResponse> collectSample(
            @Valid @RequestBody CollectSampleRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        LabSampleResponse response = labSampleService.collectSample(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF')")
    public ResponseEntity<LabSampleResponse> updateSampleStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSampleStatusRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(labSampleService.updateSampleStatus(id, request, currentUser, httpRequest));
    }
}
