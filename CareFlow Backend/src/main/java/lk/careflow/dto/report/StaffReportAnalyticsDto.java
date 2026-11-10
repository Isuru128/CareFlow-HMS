package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffReportAnalyticsDto {
    private long totalStaffEmployees;
    private long activeStaffCount;
    private long onLeaveStaffCount;
    private long inactiveStaffCount;
    private long totalDoctorsCount;

    private long todayPresentCount;
    private long todayLateCount;
    private long todayAbsentCount;
    private long todayOnLeaveCount;

    private long pendingLeaveRequestsCount;
    private long approvedLeaveRequestsCount;
    private BigDecimal monthlyPayrollCommitment;

    private List<ReportMetricItemDto> roleCategoryBreakdown;
    private List<ReportMetricItemDto> departmentStaffingBreakdown;
    private List<ReportMetricItemDto> shiftTypeBreakdown;
    private List<ReportMetricItemDto> leaveTypeBreakdown;
}

