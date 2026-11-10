package lk.careflow.dto.report;

import lk.careflow.entity.report.ReportCategory;
import lk.careflow.entity.report.ReportStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalReportDto {
    private Long id;
    private String reportNumber;
    private String reportTitle;
    private ReportCategory reportCategory;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String departmentName;
    private Long totalRecordsAnalyzed;
    private String primaryMetricLabel;
    private String primaryMetricValue;
    private String executiveSummary;
    private String keyFindings;
    private String recommendations;
    private String reportPayloadJson;
    private ReportStatus status;
    private String generatedByName;
    private Instant generatedAt;
    private Instant updatedAt;
}

