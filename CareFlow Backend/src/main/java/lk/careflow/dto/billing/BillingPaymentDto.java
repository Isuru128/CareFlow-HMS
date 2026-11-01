package lk.careflow.dto.billing;

import lk.careflow.entity.billing.BillingPaymentStatus;
import lk.careflow.entity.billing.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingPaymentDto {
    private Long id;
    private String paymentNumber;
    private Long invoiceId;
    private String invoiceNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Instant paymentDate;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String transactionReference;
    private String payerName;
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private BillingPaymentStatus status;
    private Long receivedById;
    private String receivedByName;
    private String notes;
    private Instant createdAt;
}

