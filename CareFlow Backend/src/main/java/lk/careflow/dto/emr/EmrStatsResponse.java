package lk.careflow.dto.emr;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmrStatsResponse {
    private long totalRecords;
    private long draftRecords;
    private long finalizedRecords;
    private long activeDiagnoses;
    private long activePrescriptions;
    private long dispensedPrescriptions;
    private long activeTreatments;
    private long completedTreatments;
    private long totalReports;
}
