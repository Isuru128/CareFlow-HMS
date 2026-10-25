package lk.careflow.dto.emr;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientEmrSummaryResponse {
    private Long patientId;
    private String patientNumber;
    private String fullName;
    private String gender;
    private String bloodGroup;
    private String allergies;
    private Integer age;
    private String contactNumber;
    private String emergencyContact;

    // Latest Vitals
    private String latestBloodPressure;
    private String latestHeartRate;
    private String latestTemperature;
    private String latestBmi;

    // Aggregations
    private List<MedicalRecordResponse> recentRecords;
    private List<DiagnosisResponse> activeDiagnoses;
    private List<PrescriptionResponse> activePrescriptions;
    private List<TreatmentHistoryResponse> activeTreatments;
    private List<MedicalReportResponse> recentReports;
}
