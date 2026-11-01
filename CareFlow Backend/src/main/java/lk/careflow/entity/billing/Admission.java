package lk.careflow.entity.billing;

import jakarta.persistence.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "admissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admission_number", length = 30, unique = true, nullable = false)
    private String admissionNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attending_doctor_id")
    private Doctor attendingDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "ward_name", length = 100, nullable = false)
    private String wardName;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", length = 50, nullable = false)
    private RoomType roomType;

    @Column(name = "bed_number", length = 30, nullable = false)
    private String bedNumber;

    @Column(name = "admission_date", nullable = false)
    @Builder.Default
    private Instant admissionDate = Instant.now();

    @Column(name = "discharge_date")
    private Instant dischargeDate;

    @Column(name = "daily_room_rate", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal dailyRoomRate = BigDecimal.ZERO;

    @Column(name = "nursing_fee_per_day", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal nursingFeePerDay = BigDecimal.ZERO;

    @Column(name = "admission_reason", columnDefinition = "TEXT")
    private String admissionReason;

    @Column(name = "discharge_notes", columnDefinition = "TEXT")
    private String dischargeNotes;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private AdmissionStatus status = AdmissionStatus.ADMITTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admitted_by")
    private User admittedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

