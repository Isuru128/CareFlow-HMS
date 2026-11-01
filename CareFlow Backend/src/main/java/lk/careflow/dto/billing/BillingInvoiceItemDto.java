package lk.careflow.dto.billing;

import lk.careflow.entity.billing.ChargeType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingInvoiceItemDto {
    private Long id;
    private ChargeType chargeType;
    private String referenceType;
    private Long referenceId;
    private String referenceCode;
    private String description;
    private LocalDate serviceDate;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private Instant createdAt;
}

