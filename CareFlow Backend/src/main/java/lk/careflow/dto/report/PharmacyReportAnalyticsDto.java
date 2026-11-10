package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyReportAnalyticsDto {
    private long totalMedicinesCount;
    private long activeMedicinesCount;
    private long totalBatchesCount;
    private long totalUnitsInStock;

    private long lowStockMedicinesCount;
    private long expiringSoonBatchesCount;
    private long expiredBatchesCount;

    private long totalDispensationsCount;
    private BigDecimal totalDispensationRevenue;
    private BigDecimal totalInventoryValuation;

    private List<ReportMetricItemDto> categoryStockBreakdown;
    private List<ReportMetricItemDto> batchStatusBreakdown;
    private List<ReportMetricItemDto> alertItemsSummary;
}

