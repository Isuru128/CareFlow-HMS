package lk.careflow.dto.billing;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingDashboardStatsDto {
    private long totalInvoices;
    private long issuedInvoicesCount;
    private long paidInvoicesCount;
    private long partiallyPaidCount;
    private long overdueInvoicesCount;
    private long activeAdmissionsCount;
    private BigDecimal totalBilledAmount;
    private BigDecimal totalCollectedAmount;
    private BigDecimal outstandingReceivables;
    private BigDecimal todayCollections;
    private long todayPaymentsCount;
    private BigDecimal consultationRevenue;
    private BigDecimal laboratoryRevenue;
    private BigDecimal pharmacyRevenue;
    private BigDecimal admissionRevenue;
    private BigDecimal otherRevenue;
}

