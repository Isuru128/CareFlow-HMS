package lk.careflow.controller.lab;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.lab.EnterLabResultsRequest;
import lk.careflow.dto.lab.LabResultResponse;
import lk.careflow.entity.user.User;
import lk.careflow.service.lab.LabResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/lab/results")
@RequiredArgsConstructor
public class LabResultController {

    private final LabResultService labResultService;

    @GetMapping("/item/{requestItemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<LabResultResponse>> getResultsByRequestItemId(@PathVariable Long requestItemId) {
        return ResponseEntity.ok(labResultService.getResultsByRequestItemId(requestItemId));
    }

    @GetMapping("/request/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<LabResultResponse>> getResultsByRequestId(@PathVariable Long requestId) {
        return ResponseEntity.ok(labResultService.getResultsByRequestId(requestId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF')")
    public ResponseEntity<List<LabResultResponse>> enterResults(
            @Valid @RequestBody EnterLabResultsRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        List<LabResultResponse> responses = labResultService.enterResults(request, currentUser, httpRequest);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }
}
