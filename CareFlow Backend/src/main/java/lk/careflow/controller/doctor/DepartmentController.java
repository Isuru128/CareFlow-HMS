package lk.careflow.controller.doctor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.doctor.DepartmentRequest;
import lk.careflow.dto.doctor.DepartmentResponse;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.user.User;
import lk.careflow.service.doctor.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(departmentService.getAllDepartments(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponse> createDepartment(
            @Valid @RequestBody DepartmentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        DepartmentResponse response = departmentService.createDepartment(request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteDepartment(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        departmentService.deleteDepartment(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Department deleted successfully"));
    }
}
