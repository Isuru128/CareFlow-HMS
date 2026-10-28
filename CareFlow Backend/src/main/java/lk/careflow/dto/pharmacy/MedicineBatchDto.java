package lk.careflow.dto.pharmacy;

import lk.careflow.entity.pharmacy.BatchStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineBatchDto {
    private Long id;
    private String batchNumber;
    private Long medicineId;
    private String medicineCode;
    private String medicineName;
    private String medicineStrength;
    private String unitOfMeasure;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private Integer initialQuantity;
    private Integer currentQuantity;
    private BigDecimal unitPurchasePrice;
    private BigDecimal unitSellingPrice;
    private String supplierName;
    private LocalDate receivedDate;
    private BatchStatus status;
    private String notes;
    private Long daysUntilExpiry;
    private Boolean isExpired;
    private Boolean isExpiringSoon;
    private Instant createdAt;
}
