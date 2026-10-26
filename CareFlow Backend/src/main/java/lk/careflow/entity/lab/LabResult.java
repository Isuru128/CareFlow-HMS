package lk.careflow.entity.lab;

import jakarta.persistence.*;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "lab_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_item_id", nullable = false)
    private LabRequestItem requestItem;

    @Column(name = "parameter_name", length = 100, nullable = false)
    private String parameterName;

    @Column(name = "result_value", length = 100, nullable = false)
    private String resultValue;

    @Column(name = "reference_range", length = 100)
    private String referenceRange;

    @Column(length = 50)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ResultFlag flag = ResultFlag.NORMAL;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by")
    private User enteredBy;

    @Column(name = "entered_at", nullable = false)
    @Builder.Default
    private Instant enteredAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
