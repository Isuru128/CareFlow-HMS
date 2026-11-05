package lk.careflow.dto.staff;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDashboardStatsDto {
    private long totalEmployees;
    private long activeEmployeesCount;
    private long onLeaveEmployeesCount;
    private long inactiveEmployeesCount;

    private long todayPresentCount;
    private long todayLateCount;
    private long todayAbsentCount;
    private long todayOnLeaveAttendanceCount;
    private long todayTotalMarkedCount;

    private long pendingLeaveRequestsCount;
    private long approvedLeavesCount;
    private long totalDepartmentsCount;
    private long totalAssignmentsCount;

    private BigDecimal monthlyPayrollTotal;

    private long nursesCount;
    private long labStaffCount;
    private long pharmacistsCount;
    private long receptionistsCount;
    private long accountantsCount;
    private long adminSupportCount;
}

