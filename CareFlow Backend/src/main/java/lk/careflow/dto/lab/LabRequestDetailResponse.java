package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabPriority;
import lk.careflow.entity.lab.LabRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabRequestDetailResponse {
    private Long id;
    private String requestNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientGender;
    private String patientContact;
    private Integer patientAge;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private Long medicalRecordId;
    private String medicalRecordNumber;
    private LabPriority priority;
    private LabRequestStatus status;
    private String clinicalNotes;
    private Instant requestedAt;
    private String createdByName;
    private List<LabRequestItemDto> items;
    private List<LabSampleResponse> samples;
    private LabReportResponse report;
    private Instant createdAt;
    private Instant updatedAt;
}
