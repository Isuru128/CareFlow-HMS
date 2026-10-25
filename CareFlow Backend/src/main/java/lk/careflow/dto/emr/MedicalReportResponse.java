package lk.careflow.dto.emr;

import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReportResponse {
    private Long id;
    private String reportNumber;
    private Long medicalRecordId;
    private String recordNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String reportTitle;
    private ReportType reportType;
    private LocalDate reportDate;
    private String clinicalFindings;
    private String recommendations;
    private String summary;
    private String attachmentUrl;
    private String attachmentName;
    private ReportStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
