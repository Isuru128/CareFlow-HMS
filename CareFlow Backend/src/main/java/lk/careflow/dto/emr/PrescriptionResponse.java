package lk.careflow.dto.emr;

import lk.careflow.entity.emr.PrescriptionStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionResponse {
    private Long id;
    private String prescriptionNumber;
    private Long medicalRecordId;
    private String recordNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private LocalDate issueDate;
    private LocalDate validUntil;
    private PrescriptionStatus status;
    private String instructions;
    private String notes;
    private Instant dispensedAt;
    private List<PrescriptionItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
