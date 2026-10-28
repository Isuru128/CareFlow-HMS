package lk.careflow.dto.pharmacy;

import lk.careflow.entity.pharmacy.DosageForm;
import lk.careflow.entity.pharmacy.MedicineCategory;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineDto {
    private Long id;
    private String medicineCode;
    private String name;
    private String genericName;
    private String brandName;
    private MedicineCategory category;
    private DosageForm dosageForm;
    private String strength;
    private String unitOfMeasure;
    private BigDecimal unitPrice;
    private Integer reorderLevel;
    private String manufacturer;
    private String storageConditions;
    private String description;
    private String sideEffects;
    private Boolean isActive;
    private Integer totalStock;
    private Boolean isLowStock;
    private Integer activeBatchesCount;
    private Instant createdAt;
    private Instant updatedAt;
}
