package lk.careflow.dto.lab;

import lk.careflow.entity.lab.ResultFlag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultResponse {
    private Long id;
    private Long requestItemId;
    private String parameterName;
    private String resultValue;
    private String referenceRange;
    private String unit;
    private ResultFlag flag;
    private String notes;
    private String enteredByName;
    private Instant enteredAt;
}
