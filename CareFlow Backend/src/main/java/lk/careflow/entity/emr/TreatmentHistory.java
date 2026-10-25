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
@Table(name = "treatment_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "treatment_name", length = 255, nullable = false)
    private String treatmentName;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    @Builder.Default
    private TreatmentCategory category = TreatmentCategory.MEDICATION_THERAPY;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private TreatmentStatus status = TreatmentStatus.IN_PROGRESS;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TreatmentOutcome outcome;

    @Column(name = "procedure_notes", columnDefinition = "TEXT")
    private String procedureNotes;

    @Column(columnDefinition = "TEXT")
    private String complications;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
