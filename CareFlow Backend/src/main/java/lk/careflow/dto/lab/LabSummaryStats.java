package lk.careflow.dto.lab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabSummaryStats {
    private long totalRequests;
    private long requestedCount;
    private long sampleCollectedCount;
    private long inProgressCount;
    private long completedCount;
    private long urgentStatCount;
    private long totalTestsCatalog;
}
