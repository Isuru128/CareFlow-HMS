package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import lk.careflow.entity.emr.DiagnosisSeverity;
import lk.careflow.entity.emr.DiagnosisStatus;
import lk.careflow.entity.emr.DiagnosisType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDiagnosisRequest {

    private String icd10Code;

    @NotBlank(message = "Diagnosis name is required")
    private String diagnosisName;

    private DiagnosisType diagnosisType;

    private DiagnosisStatus status;

    private DiagnosisSeverity severity;

    private LocalDate diagnosedDate;

    private LocalDate resolvedDate;

    private String notes;
}
