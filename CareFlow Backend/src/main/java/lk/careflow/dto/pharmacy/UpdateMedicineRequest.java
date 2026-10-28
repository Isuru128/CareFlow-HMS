package lk.careflow.dto.pharmacy;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.pharmacy.DosageForm;
import lk.careflow.entity.pharmacy.MedicineCategory;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String name;

    @NotBlank(message = "Generic name is required")
    private String genericName;

    private String brandName;

    @NotNull(message = "Category is required")
    private MedicineCategory category;

    @NotNull(message = "Dosage form is required")
    private DosageForm dosageForm;

    @NotBlank(message = "Strength is required")
    private String strength;

    private String unitOfMeasure;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @NotNull(message = "Reorder level is required")
    @Min(value = 0, message = "Reorder level must be non-negative")
    private Integer reorderLevel;

    private String manufacturer;
    private String storageConditions;
    private String description;
    private String sideEffects;
    private Boolean isActive;
}
