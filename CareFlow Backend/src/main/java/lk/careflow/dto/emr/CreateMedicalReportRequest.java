package lk.careflow.dto.emr;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMedicalReportRequest {

    private Long medicalRecordId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Report title is required")
    private String reportTitle;

    @NotNull(message = "Report type is required")
    private ReportType reportType;

    @Builder.Default
    private LocalDate reportDate = LocalDate.now();

    @NotBlank(message = "Clinical findings are required")
    private String clinicalFindings;

    private String recommendations;

    private String summary;

    private String attachmentUrl;

    private String attachmentName;

    @Builder.Default
    private ReportStatus status = ReportStatus.FINALIZED;
}
