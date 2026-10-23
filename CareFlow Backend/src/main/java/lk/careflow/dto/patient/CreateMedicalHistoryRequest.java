package lk.careflow.dto.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMedicalHistoryRequest {

    @NotBlank(message = "Condition or diagnosis is required")
    @Size(max = 255, message = "Condition or diagnosis must not exceed 255 characters")
    private String conditionOrDiagnosis;

    @PastOrPresent(message = "Diagnosis date cannot be in the future")
    private LocalDate diagnosisDate;

    private String treatment;

    private String surgeries;

    private String medications;

    private String notes;
}
