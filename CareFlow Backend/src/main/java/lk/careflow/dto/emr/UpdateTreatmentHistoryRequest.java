package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
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
public class UpdateTreatmentHistoryRequest {

    private Long doctorId;

    @NotBlank(message = "Treatment name is required")
    private String treatmentName;

    private TreatmentCategory category;

    private LocalDate startDate;

    private LocalDate endDate;

    private TreatmentStatus status;

    private TreatmentOutcome outcome;

    private String procedureNotes;

    private String complications;
}
