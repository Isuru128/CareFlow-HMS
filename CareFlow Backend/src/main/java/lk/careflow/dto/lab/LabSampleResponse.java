package lk.careflow.dto.lab;

import lk.careflow.entity.lab.SampleStatus;
import lk.careflow.entity.lab.SampleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabSampleResponse {
    private Long id;
    private String sampleBarcode;
    private Long requestId;
    private String requestNumber;
    private SampleType sampleType;
    private Instant collectedAt;
    private String collectedByName;
    private String collectionSite;
    private SampleStatus status;
    private String rejectionReason;
    private String notes;
}
