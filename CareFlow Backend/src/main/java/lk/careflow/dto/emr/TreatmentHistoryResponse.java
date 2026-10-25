package lk.careflow.dto.emr;

import lk.careflow.entity.emr.TreatmentCategory;
import lk.careflow.entity.emr.TreatmentOutcome;
import lk.careflow.entity.emr.TreatmentStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentHistoryResponse {
    private Long id;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Long medicalRecordId;
    private String recordNumber;
    private Long doctorId;
    private String doctorName;
    private String treatmentName;
    private TreatmentCategory category;
    private LocalDate startDate;
    private LocalDate endDate;
    private TreatmentStatus status;
    private TreatmentOutcome outcome;
    private String procedureNotes;
    private String complications;
    private Instant createdAt;
    private Instant updatedAt;
}
