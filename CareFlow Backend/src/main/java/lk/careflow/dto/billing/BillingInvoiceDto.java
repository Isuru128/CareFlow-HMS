package lk.careflow.dto.billing;

import lk.careflow.entity.billing.InvoiceStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingInvoiceDto {
    private Long id;
    private String invoiceNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientContact;
    private String patientAddress;
    private Long appointmentId;
    private String appointmentNumber;
    private Long admissionId;
    private String admissionNumber;
    private Instant issueDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;
    private InvoiceStatus status;
    private String notes;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<BillingInvoiceItemDto> items;
    private List<BillingPaymentDto> payments;
}

