package lk.careflow.entity.report;

import jakarta.persistence.*;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "hospital_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_number", length = 30, nullable = false, unique = true)
    private String reportNumber;

    @Column(name = "report_title", length = 200, nullable = false)
    private String reportTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_category", length = 40, nullable = false)
    private ReportCategory reportCategory;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "department_name", length = 100)
    @Builder.Default
    private String departmentName = "All Hospital Departments";

    @Column(name = "total_records_analyzed", nullable = false)
    @Builder.Default
    private Long totalRecordsAnalyzed = 0L;

    @Column(name = "primary_metric_label", length = 100)
    private String primaryMetricLabel;

    @Column(name = "primary_metric_value", length = 100)
    private String primaryMetricValue;

    @Column(name = "executive_summary", columnDefinition = "TEXT", nullable = false)
    private String executiveSummary;

    @Column(name = "key_findings", columnDefinition = "TEXT")
    private String keyFindings;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "report_payload_json", columnDefinition = "TEXT")
    private String reportPayloadJson;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.FINALIZED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

