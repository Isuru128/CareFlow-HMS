package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.lab.SampleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSampleStatusRequest {

    @NotNull(message = "Sample status is required")
    private SampleStatus status;

    private String rejectionReason;

    private String notes;
}
