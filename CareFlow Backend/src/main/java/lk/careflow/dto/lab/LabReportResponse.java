package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabReportResponse {
    private Long id;
    private String reportNumber;
    private Long requestId;
    private String requestNumber;
    private String patientNumber;
    private String patientName;
    private String doctorName;
    private String generatedByName;
    private String verifiedByName;
    private Instant reportDate;
    private String summary;
    private String comments;
    private LabReportStatus status;
}
