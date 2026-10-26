package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lk.careflow.entity.lab.LabCategory;
import lk.careflow.entity.lab.SampleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLabTestRequest {

    @NotBlank(message = "Test code is required")
    private String testCode;

    @NotBlank(message = "Test name is required")
    private String testName;

    @NotNull(message = "Category is required")
    private LabCategory category;

    @NotNull(message = "Sample type is required")
    private SampleType sampleType;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price cannot be negative")
    private BigDecimal price;

    private Integer turnaroundTimeHours;

    private String referenceRange;

    private String unit;

    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
