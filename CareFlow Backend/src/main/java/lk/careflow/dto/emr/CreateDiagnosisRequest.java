package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateDiagnosisRequest {

    private Long medicalRecordId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private String icd10Code;

    @NotBlank(message = "Diagnosis name is required")
    private String diagnosisName;

    @Builder.Default
    private DiagnosisType diagnosisType = DiagnosisType.PRIMARY;

    @Builder.Default
    private DiagnosisStatus status = DiagnosisStatus.ACTIVE;

    private DiagnosisSeverity severity;

    @Builder.Default
    private LocalDate diagnosedDate = LocalDate.now();

    private LocalDate resolvedDate;

    private String notes;
}
