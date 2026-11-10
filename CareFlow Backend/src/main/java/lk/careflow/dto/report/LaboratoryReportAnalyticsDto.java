package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryReportAnalyticsDto {
    private long totalCatalogTestsCount;
    private long totalLabRequestsCount;
    private long completedRequestsCount;
    private long pendingRequestsCount;
    private long totalSamplesCollectedCount;
    private long finalizedLabReportsCount;

    private long normalResultsCount;
    private long abnormalHighLowResultsCount;
    private long criticalResultsCount;
    private BigDecimal estimatedLabTestRevenue;

    private List<ReportMetricItemDto> testCategoryBreakdown;
    private List<ReportMetricItemDto> requestPriorityBreakdown;
    private List<ReportMetricItemDto> requestStatusBreakdown;
    private List<ReportMetricItemDto> resultFlagBreakdown;
}

