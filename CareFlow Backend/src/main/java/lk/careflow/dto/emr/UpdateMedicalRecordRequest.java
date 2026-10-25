package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
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
    private String chiefComplaint;

    private String examinationNotes;

    private String clinicalNotes;

    private String bloodPressure;

    private BigDecimal temperatureCelsius;

    private Integer heartRateBpm;

    private Integer respiratoryRateBpm;

    private BigDecimal weightKg;

    private BigDecimal heightCm;

    private BigDecimal bmi;

    private Integer oxygenSaturation;

    private RecordStatus status;
}
