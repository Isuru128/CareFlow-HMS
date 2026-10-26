package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabPriority;
import lk.careflow.entity.lab.LabReportStatus;
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
public class LabReportDetailResponse {
    private Long id;
    private String reportNumber;
    private Long requestId;
    private String requestNumber;
    private LabPriority priority;
    private Instant requestedAt;
    
    // Patient Details
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientGender;
    private Integer patientAge;
    private String patientBloodGroup;
    private String patientContact;

    // Doctor Details
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    // Report Details
    private Instant reportDate;
    private String generatedByName;
    private String verifiedByName;
    private String summary;
    private String comments;
    private LabReportStatus status;

    // Tests and Results
    private List<LabRequestItemDto> items;
    private List<LabSampleResponse> samples;
}
