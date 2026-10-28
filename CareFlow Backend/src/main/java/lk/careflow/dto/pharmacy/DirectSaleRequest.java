package lk.careflow.dto.pharmacy;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectSaleRequest {

    @NotBlank(message = "Customer / Patient name is required")
    private String patientName;

    private Long patientId; // Optional if registered patient

    private String doctorName;

    @NotEmpty(message = "At least one item must be purchased")
    @Valid
    private List<DirectSaleItemRequest> items;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    private String notes;
}
