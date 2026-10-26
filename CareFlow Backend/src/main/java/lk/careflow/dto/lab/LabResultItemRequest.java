package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotBlank;
import lk.careflow.entity.lab.ResultFlag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultItemRequest {

    @NotBlank(message = "Parameter name is required")
    private String parameterName;

    @NotBlank(message = "Result value is required")
    private String resultValue;

    private String referenceRange;

    private String unit;

    @Builder.Default
    private ResultFlag flag = ResultFlag.NORMAL;

    private String notes;
}
