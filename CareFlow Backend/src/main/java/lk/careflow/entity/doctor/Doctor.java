package lk.careflow.entity.doctor;

import jakarta.persistence.*;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_number", length = 30, unique = true, nullable = false)
    private String doctorNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "first_name", length = 50, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 50, nullable = false)
    private String lastName;

    @Column(length = 100, nullable = false)
    private String specialization;

    @Column(name = "license_number", length = 50, unique = true, nullable = false)
    private String licenseNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(length = 150, nullable = false)
    private String qualification;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "contact_number", length = 20, nullable = false)
    private String contactNumber;

    @Column(length = 100)
    private String email;

    @Column(name = "consultation_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal consultationFee;

    @Column(name = "room_number", length = 30)
    private String roomNumber;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private DoctorStatus status = DoctorStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by")
    private User registeredBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DoctorSchedule> schedules = new ArrayList<>();
}
