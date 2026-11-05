package lk.careflow.service.staff;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.staff.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.staff.*;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.staff.StaffAttendanceRepository;
import lk.careflow.repository.staff.StaffDepartmentAssignmentRepository;
import lk.careflow.repository.staff.StaffEmployeeRepository;
import lk.careflow.repository.staff.StaffLeaveRecordRepository;
import lk.careflow.repository.user.UserRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffEmployeeRepository employeeRepository;
    private final StaffAttendanceRepository attendanceRepository;
    private final StaffDepartmentAssignmentRepository assignmentRepository;
    private final StaffLeaveRecordRepository leaveRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public StaffDashboardStatsDto getDashboardStats() {
        LocalDate today = LocalDate.now();

        long totalEmployees = employeeRepository.count();
        long activeCount = employeeRepository.countByStatus(StaffStatus.ACTIVE);
        long onLeaveCount = employeeRepository.countByStatus(StaffStatus.ON_LEAVE);
        long inactiveCount = totalEmployees - activeCount - onLeaveCount;

        long todayPresent = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.PRESENT)
                + attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.HALF_DAY);
        long todayLate = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.LATE);
        long todayAbsent = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.ABSENT);
        long todayOnLeaveAtt = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.ON_LEAVE);
        long todayTotalMarked = attendanceRepository.countByAttendanceDate(today);

        long pendingLeaves = leaveRepository.countByStatus(LeaveStatus.PENDING);
        long approvedLeaves = leaveRepository.countByStatus(LeaveStatus.APPROVED);
        long totalDepartments = departmentRepository.count();
        long totalAssignments = assignmentRepository.count();

        BigDecimal monthlyPayroll = employeeRepository.sumActiveMonthlyPayroll();

        long nurses = employeeRepository.countByRoleCategory(StaffRoleCategory.NURSE);
        long labStaff = employeeRepository.countByRoleCategory(StaffRoleCategory.LABORATORY_STAFF);
        long pharmacists = employeeRepository.countByRoleCategory(StaffRoleCategory.PHARMACIST);
        long receptionists = employeeRepository.countByRoleCategory(StaffRoleCategory.RECEPTIONIST);
        long accountants = employeeRepository.countByRoleCategory(StaffRoleCategory.ACCOUNTANT);
        long adminSupport = employeeRepository.countByRoleCategory(StaffRoleCategory.ADMINISTRATIVE)
                + employeeRepository.countByRoleCategory(StaffRoleCategory.SUPPORT_STAFF)
                + employeeRepository.countByRoleCategory(StaffRoleCategory.DOCTOR);

        return StaffDashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .activeEmployeesCount(activeCount)
                .onLeaveEmployeesCount(onLeaveCount)
                .inactiveEmployeesCount(Math.max(0, inactiveCount))
                .todayPresentCount(todayPresent)
                .todayLateCount(todayLate)
                .todayAbsentCount(todayAbsent)
                .todayOnLeaveAttendanceCount(todayOnLeaveAtt)
                .todayTotalMarkedCount(todayTotalMarked)
                .pendingLeaveRequestsCount(pendingLeaves)
                .approvedLeavesCount(approvedLeaves)
                .totalDepartmentsCount(totalDepartments)
                .totalAssignmentsCount(totalAssignments)
                .monthlyPayrollTotal(monthlyPayroll != null ? monthlyPayroll : BigDecimal.ZERO)
                .nursesCount(nurses)
                .labStaffCount(labStaff)
                .pharmacistsCount(pharmacists)
                .receptionistsCount(receptionists)
                .accountantsCount(accountants)
                .adminSupportCount(adminSupport)
                .build();
    }

    // =========================================================================
    // 1. EMPLOYEE REGISTRATION & DIRECTORY
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<StaffEmployeeDto> searchEmployees(
            String query,
            Long departmentId,
            StaffRoleCategory roleCategory,
            EmploymentType employmentType,
            ShiftType shiftType,
            StaffStatus status,
            Pageable pageable) {
        return employeeRepository.searchEmployees(
                query, departmentId, roleCategory, employmentType, shiftType, status, pageable
        ).map(this::mapToEmployeeDto);
    }

    @Transactional(readOnly = true)
    public List<StaffEmployeeDto> getAllEmployeesList() {
        return employeeRepository.findAllByOrderByFirstNameAscLastNameAsc().stream()
                .map(this::mapToEmployeeDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffEmployeeDto getEmployeeById(Long id) {
        StaffEmployee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", id));
        return mapToEmployeeDto(employee);
    }

    @Transactional(readOnly = true)
    public StaffEmployeeDto getEmployeeByNumber(String employeeNumber) {
        StaffEmployee employee = employeeRepository.findByEmployeeNumber(employeeNumber)
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "employeeNumber", employeeNumber));
        return mapToEmployeeDto(employee);
    }

    @Transactional
    public StaffEmployeeDto registerEmployee(
            StaffEmployeeRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        String email = request.getEmail().trim().toLowerCase();
        String nic = request.getNicOrPassport().trim().toUpperCase();

        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("An employee with email '" + email + "' is already registered");
        }
        if (employeeRepository.existsByNicOrPassportIgnoreCase(nic)) {
            throw new BadRequestException("An employee with NIC/Passport '" + nic + "' is already registered");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        User linkedUser = null;
        if (request.getUserId() != null) {
            linkedUser = userRepository.findById(request.getUserId()).orElse(null);
        }

        String empNumber = generateEmployeeNumber();
        ShiftType shift = request.getShiftType() != null ? request.getShiftType() : ShiftType.REGULAR_DAY;
        LocalDate joinDate = request.getJoinDate() != null ? request.getJoinDate() : LocalDate.now();

        StaffEmployee employee = StaffEmployee.builder()
                .employeeNumber(empNumber)
                .user(linkedUser)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .nicOrPassport(nic)
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .contactNumber(request.getContactNumber().trim())
                .email(email)
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactNumber(request.getEmergencyContactNumber())
                .roleCategory(request.getRoleCategory())
                .designation(request.getDesignation().trim())
                .department(department)
                .employmentType(request.getEmploymentType() != null ? request.getEmploymentType() : EmploymentType.FULL_TIME)
                .shiftType(shift)
                .joinDate(joinDate)
                .basicSalary(request.getBasicSalary() != null ? request.getBasicSalary() : BigDecimal.ZERO)
                .qualification(request.getQualification())
                .status(request.getStatus() != null ? request.getStatus() : StaffStatus.ACTIVE)
                .annualLeaveQuota(request.getAnnualLeaveQuota() != null ? request.getAnnualLeaveQuota() : 14)
                .casualLeaveQuota(request.getCasualLeaveQuota() != null ? request.getCasualLeaveQuota() : 7)
                .sickLeaveQuota(request.getSickLeaveQuota() != null ? request.getSickLeaveQuota() : 7)
                .notes(request.getNotes())
                .registeredBy(currentUser)
                .build();

        StaffEmployee saved = employeeRepository.save(employee);

        // Record Initial Department Assignment
        StaffDepartmentAssignment initialAssign = StaffDepartmentAssignment.builder()
                .employee(saved)
                .fromDepartment(null)
                .toDepartment(department)
                .previousDesignation(null)
                .newDesignation(saved.getDesignation())
                .previousShift(null)
                .newShift(saved.getShiftType())
                .assignmentType(DepartmentAssignmentType.INITIAL_ASSIGNMENT)
                .effectiveDate(joinDate)
                .reason("Initial registration and department placement")
                .assignedBy(currentUser)
                .build();
        assignmentRepository.save(initialAssign);

        auditLogService.log(
                currentUser,
                "STAFF_EMPLOYEE_REGISTERED",
                "STAFF_EMPLOYEE",
                String.valueOf(saved.getId()),
                "Registered staff employee " + saved.getEmployeeNumber() + " (" + saved.getFirstName() + " " + saved.getLastName() + " - " + saved.getDesignation() + ") in " + department.getName(),
                httpRequest
        );

        return mapToEmployeeDto(saved);
    }

    @Transactional
    public StaffEmployeeDto updateEmployee(
            Long id,
            StaffEmployeeRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", id));

        String email = request.getEmail().trim().toLowerCase();
        String nic = request.getNicOrPassport().trim().toUpperCase();

        if (!employee.getEmail().equalsIgnoreCase(email) && employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Another employee with email '" + email + "' already exists");
        }
        if (!employee.getNicOrPassport().equalsIgnoreCase(nic) && employeeRepository.existsByNicOrPassportIgnoreCase(nic)) {
            throw new BadRequestException("Another employee with NIC/Passport '" + nic + "' already exists");
        }

        Department newDept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        Department oldDept = employee.getDepartment();
        String oldDesignation = employee.getDesignation();
        ShiftType oldShift = employee.getShiftType();
        String newDesignation = request.getDesignation().trim();
        ShiftType newShift = request.getShiftType() != null ? request.getShiftType() : oldShift;

        boolean departmentChanged = !Objects.equals(oldDept.getId(), newDept.getId());
        boolean designationChanged = !Objects.equals(oldDesignation, newDesignation);

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setNicOrPassport(nic);
        employee.setGender(request.getGender());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setContactNumber(request.getContactNumber().trim());
        employee.setEmail(email);
        employee.setAddress(request.getAddress());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactNumber(request.getEmergencyContactNumber());
        employee.setRoleCategory(request.getRoleCategory());
        employee.setDesignation(newDesignation);
        employee.setDepartment(newDept);
        if (request.getEmploymentType() != null) {
            employee.setEmploymentType(request.getEmploymentType());
        }
        employee.setShiftType(newShift);
        if (request.getJoinDate() != null) {
            employee.setJoinDate(request.getJoinDate());
        }
        if (request.getBasicSalary() != null) {
            employee.setBasicSalary(request.getBasicSalary());
        }
        employee.setQualification(request.getQualification());
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }
        if (request.getAnnualLeaveQuota() != null) {
            employee.setAnnualLeaveQuota(request.getAnnualLeaveQuota());
        }
        if (request.getCasualLeaveQuota() != null) {
            employee.setCasualLeaveQuota(request.getCasualLeaveQuota());
        }
        if (request.getSickLeaveQuota() != null) {
            employee.setSickLeaveQuota(request.getSickLeaveQuota());
        }
        employee.setNotes(request.getNotes());

        StaffEmployee updated = employeeRepository.save(employee);

        if (departmentChanged || designationChanged) {
            StaffDepartmentAssignment changeLog = StaffDepartmentAssignment.builder()
                    .employee(updated)
                    .fromDepartment(oldDept)
                    .toDepartment(newDept)
                    .previousDesignation(oldDesignation)
                    .newDesignation(newDesignation)
                    .previousShift(oldShift)
                    .newShift(newShift)
                    .assignmentType(departmentChanged ? DepartmentAssignmentType.TRANSFER : DepartmentAssignmentType.REASSIGNMENT)
                    .effectiveDate(LocalDate.now())
                    .reason("Updated via Employee Profile Management")
                    .assignedBy(currentUser)
                    .build();
            assignmentRepository.save(changeLog);
        }

        auditLogService.log(
                currentUser,
                "STAFF_EMPLOYEE_UPDATED",
                "STAFF_EMPLOYEE",
                String.valueOf(updated.getId()),
                "Updated staff profile for " + updated.getEmployeeNumber() + " (" + updated.getFirstName() + " " + updated.getLastName() + ")",
                httpRequest
        );

        return mapToEmployeeDto(updated);
    }

    // =========================================================================
    // 2. ATTENDANCE MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<StaffAttendanceDto> searchAttendance(
            String query,
            Long employeeId,
            Long departmentId,
            LocalDate attendanceDate,
            AttendanceStatus status,
            ShiftType shiftType,
            Pageable pageable) {
        return attendanceRepository.searchAttendance(
                query, employeeId, departmentId, attendanceDate, status, shiftType, pageable
        ).map(this::mapToAttendanceDto);
    }

    @Transactional(readOnly = true)
    public List<StaffAttendanceDto> getEmployeeAttendanceHistory(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId).stream()
                .map(this::mapToAttendanceDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffAttendanceDto recordOrUpdateAttendance(
            RecordAttendanceRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", request.getEmployeeId()));

        LocalDate attDate = request.getAttendanceDate() != null ? request.getAttendanceDate() : LocalDate.now();

        StaffAttendance attendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employee.getId(), attDate)
                .orElseGet(() -> StaffAttendance.builder()
                        .employee(employee)
                        .attendanceDate(attDate)
                        .build());

        LocalTime checkIn = request.getCheckInTime();
        LocalTime checkOut = request.getCheckOutTime();

        attendance.setCheckInTime(checkIn);
        attendance.setCheckOutTime(checkOut);
        attendance.setShiftType(request.getShiftType() != null ? request.getShiftType() : employee.getShiftType());
        attendance.setStatus(request.getStatus());
        attendance.setRemarks(request.getRemarks());
        attendance.setRecordedBy(currentUser);

        // Compute working hours & overtime if both checkIn and checkOut are provided
        if (request.getWorkingHours() != null && request.getWorkingHours().compareTo(BigDecimal.ZERO) > 0) {
            attendance.setWorkingHours(request.getWorkingHours());
            attendance.setOvertimeHours(request.getOvertimeHours() != null ? request.getOvertimeHours() : BigDecimal.ZERO);
        } else if (checkIn != null && checkOut != null) {
            long minutes = Duration.between(checkIn, checkOut).toMinutes();
            if (minutes < 0) {
                minutes += 24 * 60; // overnight shift support
            }
            BigDecimal worked = BigDecimal.valueOf(minutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            BigDecimal overtime = worked.subtract(BigDecimal.valueOf(8.0)).max(BigDecimal.ZERO);
            attendance.setWorkingHours(worked);
            attendance.setOvertimeHours(request.getOvertimeHours() != null ? request.getOvertimeHours() : overtime);
        } else {
            attendance.setWorkingHours(BigDecimal.ZERO);
            attendance.setOvertimeHours(BigDecimal.ZERO);
        }

        StaffAttendance saved = attendanceRepository.save(attendance);

        auditLogService.log(
                currentUser,
                "STAFF_ATTENDANCE_RECORDED",
                "STAFF_ATTENDANCE",
                String.valueOf(saved.getId()),
                "Recorded attendance (" + saved.getStatus() + ") for " + employee.getEmployeeNumber() + " on " + attDate,
                httpRequest
        );

        return mapToAttendanceDto(saved);
    }

    @Transactional
    public StaffAttendanceDto quickCheckIn(
            Long employeeId,
            String remarks,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", employeeId));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);

        StaffAttendance attendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employeeId, today)
                .orElseGet(() -> StaffAttendance.builder()
                        .employee(employee)
                        .attendanceDate(today)
                        .shiftType(employee.getShiftType())
                        .build());

        attendance.setCheckInTime(now);
        // Determine if PRESENT or LATE for morning/regular shifts
        boolean isLate = (employee.getShiftType() == ShiftType.MORNING || employee.getShiftType() == ShiftType.REGULAR_DAY)
                && now.isAfter(LocalTime.of(8, 30));
        attendance.setStatus(isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);
        if (remarks != null && !remarks.isBlank()) {
            attendance.setRemarks(remarks.trim());
        } else if (attendance.getRemarks() == null) {
            attendance.setRemarks("Checked in for " + employee.getShiftType() + " shift");
        }
        attendance.setRecordedBy(currentUser);

        StaffAttendance saved = attendanceRepository.save(attendance);

        auditLogService.log(
                currentUser,
                "STAFF_CHECK_IN",
                "STAFF_ATTENDANCE",
                String.valueOf(saved.getId()),
                "Employee " + employee.getEmployeeNumber() + " checked in at " + now,
                httpRequest
        );

        return mapToAttendanceDto(saved);
    }

    @Transactional
    public StaffAttendanceDto quickCheckOut(
            Long employeeId,
            String remarks,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", employeeId));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);

        StaffAttendance attendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employeeId, today)
                .orElseThrow(() -> new BadRequestException("Employee " + employee.getEmployeeNumber() + " has not checked in today yet"));

        attendance.setCheckOutTime(now);
        if (attendance.getCheckInTime() != null) {
            long minutes = Duration.between(attendance.getCheckInTime(), now).toMinutes();
            if (minutes < 0) {
                minutes += 24 * 60;
            }
            BigDecimal worked = BigDecimal.valueOf(minutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            BigDecimal overtime = worked.subtract(BigDecimal.valueOf(8.0)).max(BigDecimal.ZERO);
            attendance.setWorkingHours(worked);
            attendance.setOvertimeHours(overtime);
        }
        if (remarks != null && !remarks.isBlank()) {
            attendance.setRemarks(remarks.trim());
        }
        attendance.setRecordedBy(currentUser);

        StaffAttendance saved = attendanceRepository.save(attendance);

        auditLogService.log(
                currentUser,
                "STAFF_CHECK_OUT",
                "STAFF_ATTENDANCE",
                String.valueOf(saved.getId()),
                "Employee " + employee.getEmployeeNumber() + " checked out at " + now + " (Worked: " + saved.getWorkingHours() + " hrs)",
                httpRequest
        );

        return mapToAttendanceDto(saved);
    }

    // =========================================================================
    // 3. DEPARTMENT ASSIGNMENT & TRANSFERS
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<StaffDepartmentAssignmentDto> searchAssignments(
            String query,
            Long employeeId,
            Long departmentId,
            DepartmentAssignmentType assignmentType,
            Pageable pageable) {
        return assignmentRepository.searchAssignments(
                query, employeeId, departmentId, assignmentType, pageable
        ).map(this::mapToAssignmentDto);
    }

    @Transactional(readOnly = true)
    public List<StaffDepartmentAssignmentDto> getEmployeeAssignments(Long employeeId) {
        return assignmentRepository.findByEmployeeIdOrderByEffectiveDateDescCreatedAtDesc(employeeId).stream()
                .map(this::mapToAssignmentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffDepartmentAssignmentDto assignDepartment(
            AssignDepartmentRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", request.getEmployeeId()));

        Department toDept = departmentRepository.findById(request.getToDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getToDepartmentId()));

        Department fromDept = employee.getDepartment();
        String prevDesignation = employee.getDesignation();
        ShiftType prevShift = employee.getShiftType();

        String newDesignation = (request.getNewDesignation() != null && !request.getNewDesignation().isBlank())
                ? request.getNewDesignation().trim()
                : prevDesignation;
        ShiftType newShift = request.getNewShift() != null ? request.getNewShift() : prevShift;
        DepartmentAssignmentType type = request.getAssignmentType() != null
                ? request.getAssignmentType()
                : DepartmentAssignmentType.TRANSFER;

        // Update employee's active department, designation, and shift
        employee.setDepartment(toDept);
        employee.setDesignation(newDesignation);
        employee.setShiftType(newShift);
        employeeRepository.save(employee);

        StaffDepartmentAssignment assignment = StaffDepartmentAssignment.builder()
                .employee(employee)
                .fromDepartment(fromDept)
                .toDepartment(toDept)
                .previousDesignation(prevDesignation)
                .newDesignation(newDesignation)
                .previousShift(prevShift)
                .newShift(newShift)
                .assignmentType(type)
                .effectiveDate(request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now())
                .reason(request.getReason())
                .assignedBy(currentUser)
                .build();

        StaffDepartmentAssignment saved = assignmentRepository.save(assignment);

        auditLogService.log(
                currentUser,
                "STAFF_DEPARTMENT_ASSIGNED",
                "STAFF_DEPARTMENT_ASSIGNMENT",
                String.valueOf(saved.getId()),
                "Assigned " + employee.getEmployeeNumber() + " from " + (fromDept != null ? fromDept.getName() : "None") + " to " + toDept.getName() + " (" + type + ")",
                httpRequest
        );

        return mapToAssignmentDto(saved);
    }

    // =========================================================================
    // 4. LEAVE RECORDS & APPROVAL WORKFLOW
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<StaffLeaveRecordDto> searchLeaves(
            String query,
            Long employeeId,
            Long departmentId,
            LeaveType leaveType,
            LeaveStatus status,
            Pageable pageable) {
        return leaveRepository.searchLeaves(
                query, employeeId, departmentId, leaveType, status, pageable
        ).map(this::mapToLeaveDto);
    }

    @Transactional(readOnly = true)
    public List<StaffLeaveRecordDto> getEmployeeLeaves(Long employeeId) {
        return leaveRepository.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(this::mapToLeaveDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffLeaveRecordDto createLeaveRequest(
            CreateLeaveRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffEmployee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("StaffEmployee", "id", request.getEmployeeId()));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Leave end date cannot be earlier than start date");
        }

        int totalDays = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // Check quota for standard quota-tracked leave types
        if (request.getLeaveType() == LeaveType.ANNUAL) {
            int used = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(employee.getId(), LeaveType.ANNUAL);
            if (used + totalDays > employee.getAnnualLeaveQuota()) {
                throw new BadRequestException("Requested " + totalDays + " day(s) exceeds remaining Annual Leave balance (" + Math.max(0, employee.getAnnualLeaveQuota() - used) + " days left)");
            }
        } else if (request.getLeaveType() == LeaveType.CASUAL) {
            int used = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(employee.getId(), LeaveType.CASUAL);
            if (used + totalDays > employee.getCasualLeaveQuota()) {
                throw new BadRequestException("Requested " + totalDays + " day(s) exceeds remaining Casual Leave balance (" + Math.max(0, employee.getCasualLeaveQuota() - used) + " days left)");
            }
        } else if (request.getLeaveType() == LeaveType.SICK) {
            int used = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(employee.getId(), LeaveType.SICK);
            if (used + totalDays > employee.getSickLeaveQuota()) {
                throw new BadRequestException("Requested " + totalDays + " day(s) exceeds remaining Sick Leave balance (" + Math.max(0, employee.getSickLeaveQuota() - used) + " days left)");
            }
        }

        String leaveNumber = generateLeaveNumber();

        StaffLeaveRecord leave = StaffLeaveRecord.builder()
                .leaveNumber(leaveNumber)
                .employee(employee)
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(totalDays)
                .reason(request.getReason().trim())
                .handoverNotes(request.getHandoverNotes())
                .emergencyContact(request.getEmergencyContact() != null && !request.getEmergencyContact().isBlank()
                        ? request.getEmergencyContact().trim()
                        : employee.getContactNumber())
                .status(LeaveStatus.PENDING)
                .requestedBy(currentUser)
                .build();

        StaffLeaveRecord saved = leaveRepository.save(leave);

        auditLogService.log(
                currentUser,
                "STAFF_LEAVE_REQUESTED",
                "STAFF_LEAVE_RECORD",
                String.valueOf(saved.getId()),
                "Submitted " + saved.getLeaveType() + " leave request " + saved.getLeaveNumber() + " (" + totalDays + " days) for " + employee.getEmployeeNumber(),
                httpRequest
        );

        return mapToLeaveDto(saved);
    }

    @Transactional
    public StaffLeaveRecordDto reviewLeaveRequest(
            Long leaveId,
            ReviewLeaveRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        StaffLeaveRecord leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("StaffLeaveRecord", "id", leaveId));

        leave.setStatus(request.getStatus());
        leave.setReviewedBy(currentUser);
        leave.setReviewedAt(Instant.now());
        leave.setReviewComments(request.getReviewComments());

        StaffLeaveRecord saved = leaveRepository.save(leave);
        StaffEmployee employee = leave.getEmployee();
        LocalDate today = LocalDate.now();

        if (request.getStatus() == LeaveStatus.APPROVED) {
            if (!today.isBefore(leave.getStartDate()) && !today.isAfter(leave.getEndDate())) {
                employee.setStatus(StaffStatus.ON_LEAVE);
                employeeRepository.save(employee);

                // Ensure today's attendance reflects ON_LEAVE
                StaffAttendance todayAtt = attendanceRepository
                        .findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                        .orElseGet(() -> StaffAttendance.builder()
                                .employee(employee)
                                .attendanceDate(today)
                                .shiftType(employee.getShiftType())
                                .build());
                todayAtt.setStatus(AttendanceStatus.ON_LEAVE);
                todayAtt.setRemarks("On approved " + leave.getLeaveType() + " leave (" + leave.getLeaveNumber() + ")");
                todayAtt.setRecordedBy(currentUser);
                attendanceRepository.save(todayAtt);
            }
        } else if (request.getStatus() == LeaveStatus.REJECTED || request.getStatus() == LeaveStatus.CANCELLED) {
            if (employee.getStatus() == StaffStatus.ON_LEAVE) {
                employee.setStatus(StaffStatus.ACTIVE);
                employeeRepository.save(employee);
            }
        }

        auditLogService.log(
                currentUser,
                "STAFF_LEAVE_" + request.getStatus().name(),
                "STAFF_LEAVE_RECORD",
                String.valueOf(saved.getId()),
                "Reviewed leave " + saved.getLeaveNumber() + " -> " + request.getStatus() + ". Comments: " + request.getReviewComments(),
                httpRequest
        );

        return mapToLeaveDto(saved);
    }

    // =========================================================================
    // ENTITY -> DTO MAPPERS & GENERATORS
    // =========================================================================

    public StaffEmployeeDto mapToEmployeeDto(StaffEmployee e) {
        int annualUsed = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(e.getId(), LeaveType.ANNUAL);
        int casualUsed = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(e.getId(), LeaveType.CASUAL);
        int sickUsed = leaveRepository.sumApprovedLeaveDaysByEmployeeAndType(e.getId(), LeaveType.SICK);

        Optional<StaffAttendance> todayAtt = attendanceRepository.findByEmployeeIdAndAttendanceDate(e.getId(), LocalDate.now());

        return StaffEmployeeDto.builder()
                .id(e.getId())
                .employeeNumber(e.getEmployeeNumber())
                .userId(e.getUser() != null ? e.getUser().getId() : null)
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .fullName(e.getFirstName() + " " + e.getLastName())
                .nicOrPassport(e.getNicOrPassport())
                .gender(e.getGender())
                .dateOfBirth(e.getDateOfBirth())
                .contactNumber(e.getContactNumber())
                .email(e.getEmail())
                .address(e.getAddress())
                .emergencyContactName(e.getEmergencyContactName())
                .emergencyContactNumber(e.getEmergencyContactNumber())
                .roleCategory(e.getRoleCategory())
                .designation(e.getDesignation())
                .departmentId(e.getDepartment().getId())
                .departmentName(e.getDepartment().getName())
                .departmentCode(e.getDepartment().getCode())
                .employmentType(e.getEmploymentType())
                .shiftType(e.getShiftType())
                .joinDate(e.getJoinDate())
                .basicSalary(e.getBasicSalary())
                .qualification(e.getQualification())
                .status(e.getStatus())
                .annualLeaveQuota(e.getAnnualLeaveQuota())
                .casualLeaveQuota(e.getCasualLeaveQuota())
                .sickLeaveQuota(e.getSickLeaveQuota())
                .annualLeaveUsed(annualUsed)
                .casualLeaveUsed(casualUsed)
                .sickLeaveUsed(sickUsed)
                .todayAttendanceStatus(todayAtt.map(StaffAttendance::getStatus).orElse(null))
                .todayCheckInTime(todayAtt.map(StaffAttendance::getCheckInTime).orElse(null))
                .todayCheckOutTime(todayAtt.map(StaffAttendance::getCheckOutTime).orElse(null))
                .notes(e.getNotes())
                .registeredByName(e.getRegisteredBy() != null ? e.getRegisteredBy().getFirstName() + " " + e.getRegisteredBy().getLastName() : "HR Admin")
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public StaffAttendanceDto mapToAttendanceDto(StaffAttendance a) {
        StaffEmployee e = a.getEmployee();
        return StaffAttendanceDto.builder()
                .id(a.getId())
                .employeeId(e.getId())
                .employeeNumber(e.getEmployeeNumber())
                .employeeName(e.getFirstName() + " " + e.getLastName())
                .designation(e.getDesignation())
                .roleCategory(e.getRoleCategory())
                .departmentId(e.getDepartment().getId())
                .departmentName(e.getDepartment().getName())
                .attendanceDate(a.getAttendanceDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .shiftType(a.getShiftType())
                .status(a.getStatus())
                .workingHours(a.getWorkingHours())
                .overtimeHours(a.getOvertimeHours())
                .remarks(a.getRemarks())
                .recordedByName(a.getRecordedBy() != null ? a.getRecordedBy().getFirstName() + " " + a.getRecordedBy().getLastName() : "HR Desk")
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    public StaffDepartmentAssignmentDto mapToAssignmentDto(StaffDepartmentAssignment a) {
        StaffEmployee e = a.getEmployee();
        return StaffDepartmentAssignmentDto.builder()
                .id(a.getId())
                .employeeId(e.getId())
                .employeeNumber(e.getEmployeeNumber())
                .employeeName(e.getFirstName() + " " + e.getLastName())
                .roleCategory(e.getRoleCategory())
                .fromDepartmentId(a.getFromDepartment() != null ? a.getFromDepartment().getId() : null)
                .fromDepartmentName(a.getFromDepartment() != null ? a.getFromDepartment().getName() : "Initial Onboarding")
                .fromDepartmentCode(a.getFromDepartment() != null ? a.getFromDepartment().getCode() : "NEW")
                .toDepartmentId(a.getToDepartment().getId())
                .toDepartmentName(a.getToDepartment().getName())
                .toDepartmentCode(a.getToDepartment().getCode())
                .previousDesignation(a.getPreviousDesignation())
                .newDesignation(a.getNewDesignation())
                .previousShift(a.getPreviousShift())
                .newShift(a.getNewShift())
                .assignmentType(a.getAssignmentType())
                .effectiveDate(a.getEffectiveDate())
                .reason(a.getReason())
                .assignedByName(a.getAssignedBy() != null ? a.getAssignedBy().getFirstName() + " " + a.getAssignedBy().getLastName() : "HR Admin")
                .createdAt(a.getCreatedAt())
                .build();
    }

    public StaffLeaveRecordDto mapToLeaveDto(StaffLeaveRecord l) {
        StaffEmployee e = l.getEmployee();
        return StaffLeaveRecordDto.builder()
                .id(l.getId())
                .leaveNumber(l.getLeaveNumber())
                .employeeId(e.getId())
                .employeeNumber(e.getEmployeeNumber())
                .employeeName(e.getFirstName() + " " + e.getLastName())
                .designation(e.getDesignation())
                .roleCategory(e.getRoleCategory())
                .departmentId(e.getDepartment().getId())
                .departmentName(e.getDepartment().getName())
                .leaveType(l.getLeaveType())
                .startDate(l.getStartDate())
                .endDate(l.getEndDate())
                .totalDays(l.getTotalDays())
                .reason(l.getReason())
                .handoverNotes(l.getHandoverNotes())
                .emergencyContact(l.getEmergencyContact())
                .status(l.getStatus())
                .reviewedByName(l.getReviewedBy() != null ? l.getReviewedBy().getFirstName() + " " + l.getReviewedBy().getLastName() : null)
                .reviewedAt(l.getReviewedAt())
                .reviewComments(l.getReviewComments())
                .requestedByName(l.getRequestedBy() != null ? l.getRequestedBy().getFirstName() + " " + l.getRequestedBy().getLastName() : e.getFirstName() + " " + e.getLastName())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    private synchronized String generateEmployeeNumber() {
        return employeeRepository.findTopByOrderByIdDesc()
                .map(emp -> String.format("EMP-%05d", emp.getId() + 10001))
                .orElse("EMP-10001");
    }

    private synchronized String generateLeaveNumber() {
        return leaveRepository.findTopByOrderByIdDesc()
                .map(lve -> String.format("LVE-%05d", lve.getId() + 10001))
                .orElse("LVE-10001");
    }
}

