package lk.careflow.entity.pharmacy;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medicine_code", length = 30, unique = true, nullable = false)
    private String medicineCode;

    @Column(length = 150, nullable = false)
    private String name;

    @Column(name = "generic_name", length = 150, nullable = false)
    private String genericName;

    @Column(name = "brand_name", length = 150)
    private String brandName;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private MedicineCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "dosage_form", length = 50, nullable = false)
    private DosageForm dosageForm;

    @Column(length = 50, nullable = false)
    private String strength;

    @Column(name = "unit_of_measure", length = 30, nullable = false)
    @Builder.Default
    private String unitOfMeasure = "TABLET";

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "reorder_level", nullable = false)
    @Builder.Default
    private Integer reorderLevel = 50;

    @Column(length = 150)
    private String manufacturer;

    @Column(name = "storage_conditions", length = 150)
    @Builder.Default
    private String storageConditions = "Store below 25°C in a dry place";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MedicineBatch> batches = new ArrayList<>();
}
