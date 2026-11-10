package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueReportAnalyticsDto {
    private long totalInvoicesCount;
    private long paidInvoicesCount;
    private long partiallyPaidInvoicesCount;
    private long unpaidInvoicesCount;
    private long totalPaymentsCount;

    private BigDecimal totalBilledRevenue;
    private BigDecimal totalCollectedRevenue;
    private BigDecimal outstandingReceivables;
    private BigDecimal totalDiscountsGranted;
    private double collectionRatePercentage;

    private BigDecimal consultationRevenue;
    private BigDecimal laboratoryRevenue;
    private BigDecimal pharmacyRevenue;
    private BigDecimal admissionRevenue;
    private BigDecimal procedureAndOtherRevenue;

    private List<ReportMetricItemDto> chargeCategoryBreakdown;
    private List<ReportMetricItemDto> paymentMethodBreakdown;
    private List<ReportMetricItemDto> invoiceStatusBreakdown;
}

