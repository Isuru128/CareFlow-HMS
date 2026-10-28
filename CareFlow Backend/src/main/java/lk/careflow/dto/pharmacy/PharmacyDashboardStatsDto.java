package lk.careflow.dto.pharmacy;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyDashboardStatsDto {
    private long totalMedicines;
    private long activeMedicines;
    private long totalBatches;
    private long lowStockCount;
    private long expiringSoonCount;
    private long expiredCount;
    private long todayDispensationsCount;
    private BigDecimal todayRevenue;
    private BigDecimal totalRevenue;
    private BigDecimal totalInventoryValue;
}
