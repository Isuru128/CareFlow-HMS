package lk.careflow.entity.pharmacy;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "medicine_batches",
    uniqueConstraints = @UniqueConstraint(name = "uq_medicine_batch", columnNames = {"medicine_id", "batch_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", length = 50, nullable = false)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity;

    @Column(name = "unit_purchase_price", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitPurchasePrice = BigDecimal.ZERO;

    @Column(name = "unit_selling_price", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitSellingPrice = BigDecimal.ZERO;

    @Column(name = "supplier_name", length = 150)
    private String supplierName;

    @Column(name = "received_date", nullable = false)
    @Builder.Default
    private LocalDate receivedDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private BatchStatus status = BatchStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
