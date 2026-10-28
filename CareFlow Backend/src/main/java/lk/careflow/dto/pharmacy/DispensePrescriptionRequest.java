package lk.careflow.dto.pharmacy;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispensePrescriptionRequest {

    @NotNull(message = "Prescription ID is required")
    private Long prescriptionId;

    @NotEmpty(message = "At least one item must be dispensed")
    @Valid
    private List<DispenseItemRequest> items;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    private String notes;
}
