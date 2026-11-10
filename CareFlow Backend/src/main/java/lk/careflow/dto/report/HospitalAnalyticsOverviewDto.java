package lk.careflow.dto.report;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalAnalyticsOverviewDto {
    private long totalSavedReportsCount;
    private PatientReportAnalyticsDto patientReport;
    private AppointmentReportAnalyticsDto appointmentReport;
    private RevenueReportAnalyticsDto revenueReport;
    private PharmacyReportAnalyticsDto pharmacyReport;
    private LaboratoryReportAnalyticsDto laboratoryReport;
    private StaffReportAnalyticsDto staffReport;
}

