package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateLabReportRequest {

    @NotNull(message = "Request ID is required")
    private Long requestId;

    @NotBlank(message = "Clinical summary is required")
    private String summary;

    private String comments;

    @Builder.Default
    private Boolean finalizeReport = false;
}
