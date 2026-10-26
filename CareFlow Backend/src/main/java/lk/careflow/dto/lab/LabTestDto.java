package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabCategory;
import lk.careflow.entity.lab.SampleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTestDto {
    private Long id;
    private String testCode;
    private String testName;
    private LabCategory category;
    private SampleType sampleType;
    private BigDecimal price;
    private Integer turnaroundTimeHours;
    private String referenceRange;
    private String unit;
    private String description;
    private Boolean isActive;
    private Instant createdAt;
}
