package lk.careflow.dto.patient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalHistoryResponse {

    private Long id;
    private Long patientId;
    private String patientNumber;
    private String conditionOrDiagnosis;
    private LocalDate diagnosisDate;
    private String treatment;
    private String surgeries;
    private String medications;
    private String notes;
    private Long recordedById;
    private String recordedByName;
    private Instant createdAt;
    private Instant updatedAt;
}
