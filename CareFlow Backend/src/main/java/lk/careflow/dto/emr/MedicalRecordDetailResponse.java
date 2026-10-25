package lk.careflow.dto.emr;

import lk.careflow.entity.emr.RecordStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordDetailResponse {
    private Long id;
    private String recordNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientGender;
    private String patientBloodGroup;
    private String patientAllergies;
    private Long doctorId;
    private String doctorNumber;
    private String doctorName;
    private String doctorSpecialization;
    private Long appointmentId;
    private String appointmentNumber;
    private Instant visitDate;
    private String chiefComplaint;
    private String examinationNotes;
    private String clinicalNotes;
    private String bloodPressure;
    private BigDecimal temperatureCelsius;
    private Integer heartRateBpm;
    private Integer respiratoryRateBpm;
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal bmi;
    private Integer oxygenSaturation;
    private RecordStatus status;
    private String createdByName;
    private List<DiagnosisResponse> diagnoses;
    private List<PrescriptionResponse> prescriptions;
    private List<TreatmentHistoryResponse> treatmentHistories;
    private List<MedicalReportResponse> medicalReports;
    private Instant createdAt;
    private Instant updatedAt;
}
