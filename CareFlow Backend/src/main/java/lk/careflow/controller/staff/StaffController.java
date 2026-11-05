package lk.careflow.controller.staff;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.staff.*;
import lk.careflow.entity.staff.*;
import lk.careflow.entity.user.User;
import lk.careflow.service.staff.StaffService;
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

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(staffService.getDashboardStats());
    }

    // =========================================================================
    // 1. EMPLOYEE REGISTRATION & DIRECTORY ENDPOINTS
    // =========================================================================

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<StaffEmployeeDto>> searchEmployees(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) StaffRoleCategory roleCategory,
            @RequestParam(required = false) EmploymentType employmentType,
            @RequestParam(required = false) ShiftType shiftType,
            @RequestParam(required = false) StaffStatus status,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(staffService.searchEmployees(
                query, departmentId, roleCategory, employmentType, shiftType, status, pageable));
    }

    @GetMapping("/employees/list")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<StaffEmployeeDto>> getAllEmployeesList() {
        return ResponseEntity.ok(staffService.getAllEmployeesList());
    }

    @GetMapping("/employees/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffEmployeeDto> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getEmployeeById(id));
    }

    @GetMapping("/employees/number/{employeeNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffEmployeeDto> getEmployeeByNumber(@PathVariable String employeeNumber) {
        return ResponseEntity.ok(staffService.getEmployeeByNumber(employeeNumber));
    }

    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffEmployeeDto> registerEmployee(
            @Valid @RequestBody StaffEmployeeRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StaffEmployeeDto dto = staffService.registerEmployee(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PutMapping("/employees/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffEmployeeDto> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody StaffEmployeeRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(staffService.updateEmployee(id, request, currentUser, httpRequest));
    }

    // =========================================================================
    // 2. ATTENDANCE ENDPOINTS
    // =========================================================================

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<StaffAttendanceDto>> searchAttendance(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate attendanceDate,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) ShiftType shiftType,
            @PageableDefault(size = 15, sort = "attendanceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(staffService.searchAttendance(
                query, employeeId, departmentId, attendanceDate, status, shiftType, pageable));
    }

    @GetMapping("/employees/{employeeId}/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<StaffAttendanceDto>> getEmployeeAttendanceHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(staffService.getEmployeeAttendanceHistory(employeeId));
    }

    @PostMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffAttendanceDto> recordOrUpdateAttendance(
            @Valid @RequestBody RecordAttendanceRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(staffService.recordOrUpdateAttendance(request, currentUser, httpRequest));
    }

    @PostMapping("/employees/{employeeId}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffAttendanceDto> quickCheckIn(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String remarks,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(staffService.quickCheckIn(employeeId, remarks, currentUser, httpRequest));
    }

    @PostMapping("/employees/{employeeId}/check-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffAttendanceDto> quickCheckOut(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String remarks,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(staffService.quickCheckOut(employeeId, remarks, currentUser, httpRequest));
    }

    // =========================================================================
    // 3. DEPARTMENT ASSIGNMENT ENDPOINTS
    // =========================================================================

    @GetMapping("/department-assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<StaffDepartmentAssignmentDto>> searchAssignments(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) DepartmentAssignmentType assignmentType,
            @PageableDefault(size = 15, sort = "effectiveDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(staffService.searchAssignments(
                query, employeeId, departmentId, assignmentType, pageable));
    }

    @GetMapping("/employees/{employeeId}/department-assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<StaffDepartmentAssignmentDto>> getEmployeeAssignments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(staffService.getEmployeeAssignments(employeeId));
    }

    @PostMapping("/department-assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffDepartmentAssignmentDto> assignDepartment(
            @Valid @RequestBody AssignDepartmentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StaffDepartmentAssignmentDto dto = staffService.assignDepartment(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    // =========================================================================
    // 4. LEAVE RECORDS ENDPOINTS
    // =========================================================================

    @GetMapping("/leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<StaffLeaveRecordDto>> searchLeaves(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) LeaveType leaveType,
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(staffService.searchLeaves(
                query, employeeId, departmentId, leaveType, status, pageable));
    }

    @GetMapping("/employees/{employeeId}/leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<StaffLeaveRecordDto>> getEmployeeLeaves(@PathVariable Long employeeId) {
        return ResponseEntity.ok(staffService.getEmployeeLeaves(employeeId));
    }

    @PostMapping("/leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffLeaveRecordDto> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StaffLeaveRecordDto dto = staffService.createLeaveRequest(request, currentUser, httpRequest);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PutMapping("/leaves/{leaveId}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<StaffLeaveRecordDto> reviewLeaveRequest(
            @PathVariable Long leaveId,
            @Valid @RequestBody ReviewLeaveRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(staffService.reviewLeaveRequest(leaveId, request, currentUser, httpRequest));
    }
}

