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
@Table(name = "medical_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_number", length = 30, unique = true, nullable = false)
    private String reportNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "report_title", length = 255, nullable = false)
    private String reportTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", length = 50, nullable = false)
    private ReportType reportType;

    @Column(name = "report_date", nullable = false)
    @Builder.Default
    private LocalDate reportDate = LocalDate.now();

    @Column(name = "clinical_findings", nullable = false, columnDefinition = "TEXT")
    private String clinicalFindings;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "attachment_url", length = 512)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.FINALIZED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
