package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.emr.RecordStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMedicalRecordRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long appointmentId;

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

    @Builder.Default
    private RecordStatus status = RecordStatus.FINALIZED;

    // Optional initial nested diagnosis or prescription items
    private List<CreateDiagnosisRequest> diagnoses;

    private List<PrescriptionItemDto> prescriptionItems;

    private String prescriptionInstructions;
}
