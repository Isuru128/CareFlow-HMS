package lk.careflow.entity.pharmacy;

import jakarta.persistence.*;
import lk.careflow.entity.emr.Prescription;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacy_dispensations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyDispensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispensation_number", length = 30, unique = true, nullable = false)
    private String dispensationNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "patient_name", length = 150, nullable = false)
    private String patientName;

    @Column(name = "doctor_name", length = 150)
    private String doctorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispensed_by")
    private User dispensedBy;

    @Column(name = "dispensed_at", nullable = false)
    @Builder.Default
    private Instant dispensedAt = Instant.now();

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30, nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private DispensationStatus status = DispensationStatus.COMPLETED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "dispensation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PharmacyDispensationItem> items = new ArrayList<>();
}
