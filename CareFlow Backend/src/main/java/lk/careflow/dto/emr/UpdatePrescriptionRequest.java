package lk.careflow.dto.emr;

import jakarta.validation.Valid;
import lk.careflow.entity.emr.PrescriptionStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePrescriptionRequest {

    private LocalDate validUntil;

    private PrescriptionStatus status;

    private String instructions;

    private String notes;

    @Valid
    private List<PrescriptionItemDto> items;
}
