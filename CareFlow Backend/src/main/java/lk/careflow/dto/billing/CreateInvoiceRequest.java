package lk.careflow.dto.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.billing.InvoiceStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateInvoiceRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long appointmentId;

    private Long admissionId;

    private LocalDate dueDate;

    private BigDecimal discountAmount;

    private BigDecimal taxAmount;

    private InvoiceStatus status;

    private String notes;

    @NotEmpty(message = "At least one billable charge item is required")
    @Valid
    private List<InvoiceItemRequest> items;

    private RecordPaymentRequest initialPayment;
}

