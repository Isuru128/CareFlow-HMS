package lk.careflow.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.report.ReportCategory;
import lk.careflow.entity.report.ReportStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateReportRequest {

    @NotBlank(message = "Report title is required")
    private String reportTitle;

    @NotNull(message = "Report category is required")
    private ReportCategory reportCategory;

    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String departmentName;
    private String executiveSummary;
    private String keyFindings;
    private String recommendations;
    private ReportStatus status;
}

