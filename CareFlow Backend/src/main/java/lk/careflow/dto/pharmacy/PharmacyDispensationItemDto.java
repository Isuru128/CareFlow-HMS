package lk.careflow.dto.pharmacy;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyDispensationItemDto {
    private Long id;
    private Long medicineId;
    private String medicineCode;
    private String medicineName;
    private String medicineStrength;
    private Long batchId;
    private String batchNumber;
    private Long prescriptionItemId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String dosageInstructions;
    private Instant createdAt;
}
