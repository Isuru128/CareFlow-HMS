package lk.careflow.dto.report;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportMetricItemDto {
    private String key;
    private String label;
    private long count;
    private BigDecimal amount;
    private double percentage;
    private String secondaryInfo;
}

