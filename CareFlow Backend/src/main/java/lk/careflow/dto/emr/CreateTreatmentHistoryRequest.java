package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.emr.TreatmentCategory;
import lk.careflow.entity.emr.TreatmentOutcome;
import lk.careflow.entity.emr.TreatmentStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTreatmentHistoryRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long medicalRecordId;

    private Long doctorId;

    @NotBlank(message = "Treatment name is required")
    private String treatmentName;

    @Builder.Default
    private TreatmentCategory category = TreatmentCategory.MEDICATION_THERAPY;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private TreatmentStatus status = TreatmentStatus.IN_PROGRESS;

    private TreatmentOutcome outcome;

    private String procedureNotes;

    private String complications;
}
