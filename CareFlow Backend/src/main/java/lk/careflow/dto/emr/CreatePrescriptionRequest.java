package lk.careflow.dto.emr;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.emr.PrescriptionStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePrescriptionRequest {

    private Long medicalRecordId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @Builder.Default
    private LocalDate issueDate = LocalDate.now();

    private LocalDate validUntil;

    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.ACTIVE;

    private String instructions;

    private String notes;

    @NotEmpty(message = "At least one medication item is required")
    @Valid
    private List<PrescriptionItemDto> items;
}
