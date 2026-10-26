package lk.careflow.controller.lab;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.lab.CreateLabTestRequest;
import lk.careflow.dto.lab.LabTestDto;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.lab.LabCategory;
import lk.careflow.entity.user.User;
import lk.careflow.service.lab.LabCatalogService;
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
@RequestMapping("/api/lab/tests")
@RequiredArgsConstructor
public class LabCatalogController {

    private final LabCatalogService labCatalogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<LabTestDto>> searchTests(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) LabCategory category,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "testName", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(labCatalogService.searchTests(query, category, isActive, pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<LabTestDto>> getActiveTests() {
        return ResponseEntity.ok(labCatalogService.getAllActiveTests());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<LabTestDto> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(labCatalogService.getTestById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF')")
    public ResponseEntity<LabTestDto> createTest(
            @Valid @RequestBody CreateLabTestRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        LabTestDto created = labCatalogService.createTest(request, currentUser, httpRequest);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LABORATORY_STAFF')")
    public ResponseEntity<LabTestDto> updateTest(
            @PathVariable Long id,
            @Valid @RequestBody CreateLabTestRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(labCatalogService.updateTest(id, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteTest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        labCatalogService.deleteTest(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Lab test successfully deactivated"));
    }
}
