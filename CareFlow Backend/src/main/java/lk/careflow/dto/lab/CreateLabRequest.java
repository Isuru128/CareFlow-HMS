package lk.careflow.dto.lab;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.lab.LabPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLabRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long doctorId;

    private Long medicalRecordId;

    @Builder.Default
    private LabPriority priority = LabPriority.ROUTINE;

    private String clinicalNotes;

    @NotEmpty(message = "At least one lab test must be selected")
    private List<Long> testIds;
}
