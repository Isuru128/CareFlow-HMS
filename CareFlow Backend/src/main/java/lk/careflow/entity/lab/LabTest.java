package lk.careflow.entity.lab;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "lab_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_code", length = 30, unique = true, nullable = false)
    private String testCode;

    @Column(name = "test_name", length = 150, nullable = false)
    private String testName;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private LabCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "sample_type", length = 50, nullable = false)
    private SampleType sampleType;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "turnaround_time_hours", nullable = false)
    @Builder.Default
    private Integer turnaroundTimeHours = 24;

    @Column(name = "reference_range", length = 150)
    private String referenceRange;

    @Column(length = 50)
    private String unit;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
