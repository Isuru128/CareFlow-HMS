package lk.careflow.dto.pharmacy;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispenseItemRequest {

    private Long prescriptionItemId;

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    private Long batchId; // Optional: If omitted, the earliest expiring batch is chosen (FEFO)

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String dosageInstructions;
}
