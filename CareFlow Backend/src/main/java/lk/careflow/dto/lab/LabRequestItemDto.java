package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabRequestItemDto {
    private Long id;
    private Long labTestId;
    private String testCode;
    private String testName;
    private String category;
    private String sampleType;
    private LabItemStatus status;
    private String notes;
    private List<LabResultResponse> results;
}
