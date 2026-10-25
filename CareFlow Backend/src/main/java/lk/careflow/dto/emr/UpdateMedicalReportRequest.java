package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMedicalReportRequest {

    @NotBlank(message = "Report title is required")
    private String reportTitle;

    private ReportType reportType;

    private LocalDate reportDate;

    @NotBlank(message = "Clinical findings are required")
    private String clinicalFindings;

    private String recommendations;

    private String summary;

    private String attachmentUrl;

    private String attachmentName;

    private ReportStatus status;
}
