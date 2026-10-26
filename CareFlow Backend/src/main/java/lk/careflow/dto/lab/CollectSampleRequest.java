package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.lab.SampleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectSampleRequest {

    @NotNull(message = "Request ID is required")
    private Long requestId;

    @NotNull(message = "Sample type is required")
    private SampleType sampleType;

    private String collectionSite;

    private String notes;
}
