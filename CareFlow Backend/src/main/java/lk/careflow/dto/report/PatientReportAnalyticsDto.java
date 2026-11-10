package lk.careflow.dto.report;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientReportAnalyticsDto {
    private long totalPatients;
    private long activePatientsCount;
    private long inactivePatientsCount;
    private long deceasedPatientsCount;

    private long malePatientsCount;
    private long femalePatientsCount;
    private long otherGenderCount;

    private long totalAdmissionsCount;
    private long activeAdmissionsCount;
    private long dischargedAdmissionsCount;
    private long totalMedicalRecordsCount;

    private List<ReportMetricItemDto> genderBreakdown;
    private List<ReportMetricItemDto> bloodGroupBreakdown;
    private List<ReportMetricItemDto> statusBreakdown;
    private List<ReportMetricItemDto> admissionRoomTypeBreakdown;
}

