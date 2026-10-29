package lk.careflow.dto.pharmacy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentRequest {

    @NotNull(message = "Batch ID is required")
    private Long batchId;

    @NotNull(message = "Adjustment quantity is required")
    private Integer adjustmentQuantity; // Can be positive (addition) or negative (subtraction)

    @NotBlank(message = "Adjustment reason is required")
    private String reason; // E.g., "PHYSICAL_COUNT_RECONCILIATION", "DAMAGED_EXPIRED", "LOSS_BREAKAGE"

    private String notes;
}
