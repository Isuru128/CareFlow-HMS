package lk.careflow.dto.emr;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.careflow.entity.emr.RecordStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMedicalRecordRequest {

    private Instant visitDate;

    @NotBlank(message = "Chief complaint is required")
    @Size(min = 3, max = 1000, message = "Chief complaint must be between 3 and 1000 characters")
    private String chiefComplaint;

    @Size(max = 2000, message = "Examination notes must not exceed 2000 characters")
    private String examinationNotes;

    @Size(max = 2000, message = "Clinical notes must not exceed 2000 characters")
    private String clinicalNotes;

    @Pattern(regexp = "^$|^[0-9]{2,3}/[0-9]{2,3}(\\s*mmHg)?$", message = "Blood pressure must be in systolic/diastolic format (e.g., 120/80)")
    private String bloodPressure;

    @DecimalMin(value = "30.0", message = "Temperature must be at least 30.0 °C")
    @DecimalMax(value = "45.0", message = "Temperature must not exceed 45.0 °C")
    private BigDecimal temperatureCelsius;

    @Min(value = 20, message = "Heart rate must be at least 20 bpm")
    @Max(value = 300, message = "Heart rate must not exceed 300 bpm")
    private Integer heartRateBpm;

    @Min(value = 4, message = "Respiratory rate must be at least 4 breaths/min")
    @Max(value = 100, message = "Respiratory rate must not exceed 100 breaths/min")
    private Integer respiratoryRateBpm;

    @DecimalMin(value = "0.5", message = "Weight must be at least 0.5 kg")
    @DecimalMax(value = "500.0", message = "Weight must not exceed 500.0 kg")
    private BigDecimal weightKg;

    @DecimalMin(value = "20.0", message = "Height must be at least 20.0 cm")
    @DecimalMax(value = "300.0", message = "Height must not exceed 300.0 cm")
    private BigDecimal heightCm;

    private BigDecimal bmi;

    @Min(value = 50, message = "Oxygen saturation (SpO2) must be at least 50%")
    @Max(value = 100, message = "Oxygen saturation (SpO2) cannot exceed 100%")
    private Integer oxygenSaturation;

    private RecordStatus status;
}
