package lk.careflow.dto.emr;

import lk.careflow.entity.emr.DiagnosisSeverity;
import lk.careflow.entity.emr.DiagnosisStatus;
import lk.careflow.entity.emr.DiagnosisType;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnosisResponse {
    private Long id;
    private Long medicalRecordId;
    private String recordNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String icd10Code;
    private String diagnosisName;
    private DiagnosisType diagnosisType;
    private DiagnosisStatus status;
    private DiagnosisSeverity severity;
    private LocalDate diagnosedDate;
    private LocalDate resolvedDate;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
