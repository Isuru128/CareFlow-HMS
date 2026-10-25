package lk.careflow.entity.emr;

import jakarta.persistence.*;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.patient.Patient;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patient_diagnoses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDiagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "icd10_code", length = 30)
    private String icd10Code;

    @Column(name = "diagnosis_name", length = 255, nullable = false)
    private String diagnosisName;

    @Enumerated(EnumType.STRING)
    @Column(name = "diagnosis_type", length = 30, nullable = false)
    @Builder.Default
    private DiagnosisType diagnosisType = DiagnosisType.PRIMARY;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private DiagnosisStatus status = DiagnosisStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DiagnosisSeverity severity;

    @Column(name = "diagnosed_date", nullable = false)
    @Builder.Default
    private LocalDate diagnosedDate = LocalDate.now();

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
