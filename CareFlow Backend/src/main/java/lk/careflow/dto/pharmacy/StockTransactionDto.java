package lk.careflow.dto.pharmacy;

import lk.careflow.entity.pharmacy.StockTransactionType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransactionDto {
    private Long id;
    private Long medicineId;
    private String medicineCode;
    private String medicineName;
    private Long batchId;
    private String batchNumber;
    private StockTransactionType transactionType;
    private Integer quantity;
    private Integer balanceAfter;
    private String referenceNumber;
    private String notes;
    private String performedByName;
    private Instant createdAt;
}
