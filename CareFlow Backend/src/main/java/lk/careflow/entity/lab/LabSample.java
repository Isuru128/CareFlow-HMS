package lk.careflow.entity.lab;

import jakarta.persistence.*;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "lab_samples")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sample_barcode", length = 50, unique = true, nullable = false)
    private String sampleBarcode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private LabRequest request;

    @Enumerated(EnumType.STRING)
    @Column(name = "sample_type", length = 50, nullable = false)
    private SampleType sampleType;

    @Column(name = "collected_at", nullable = false)
    @Builder.Default
    private Instant collectedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by")
    private User collectedBy;

    @Column(name = "collection_site", length = 100)
    private String collectionSite;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private SampleStatus status = SampleStatus.COLLECTED;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
