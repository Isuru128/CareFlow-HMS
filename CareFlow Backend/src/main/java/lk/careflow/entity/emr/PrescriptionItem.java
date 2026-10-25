package lk.careflow.entity.emr;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medication_name", length = 255, nullable = false)
    private String medicationName;

    @Column(length = 100, nullable = false)
    private String dosage;

    @Column(length = 100, nullable = false)
    private String frequency;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    @Builder.Default
    private MedicationRoute route = MedicationRoute.ORAL;

    @Column(length = 50, nullable = false)
    private String duration;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "is_dispensed", nullable = false)
    @Builder.Default
    private Boolean isDispensed = false;
}
