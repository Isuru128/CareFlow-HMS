package lk.careflow.dto.pharmacy;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBatchRequest {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    private LocalDate manufactureDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer initialQuantity;

    @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price must be non-negative")
    private BigDecimal unitPurchasePrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Selling price must be non-negative")
    private BigDecimal unitSellingPrice;

    private String supplierName;
    private LocalDate receivedDate;
    private String notes;
}
