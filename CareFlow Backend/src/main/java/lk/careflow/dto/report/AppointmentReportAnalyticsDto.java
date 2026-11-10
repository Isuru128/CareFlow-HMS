package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentReportAnalyticsDto {
    private long totalAppointments;
    private long scheduledCount;
    private long confirmedCount;
    private long completedCount;
    private long cancelledCount;
    private long noShowCount;

    private double completionRatePercentage;
    private double cancellationRatePercentage;
    private BigDecimal estimatedConsultationValue;

    private List<ReportMetricItemDto> statusBreakdown;
    private List<ReportMetricItemDto> typeBreakdown;
    private List<ReportMetricItemDto> departmentBreakdown;
    private List<ReportMetricItemDto> doctorWorkloadBreakdown;
}

