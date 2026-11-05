package lk.careflow.entity.staff;

import jakarta.persistence.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "staff_employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffEmployee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_number", length = 30, nullable = false, unique = true)
    private String employeeNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "first_name", length = 50, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 50, nullable = false)
    private String lastName;

    @Column(name = "nic_or_passport", length = 50, nullable = false, unique = true)
    private String nicOrPassport;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Gender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "contact_number", length = 20, nullable = false)
    private String contactNumber;

    @Column(length = 100, nullable = false, unique = true)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_number", length = 20)
    private String emergencyContactNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_category", length = 40, nullable = false)
    private StaffRoleCategory roleCategory;

    @Column(length = 100, nullable = false)
    private String designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 30, nullable = false)
    @Builder.Default
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", length = 30, nullable = false)
    @Builder.Default
    private ShiftType shiftType = ShiftType.REGULAR_DAY;

    @Column(name = "join_date", nullable = false)
    @Builder.Default
    private LocalDate joinDate = LocalDate.now();

    @Column(name = "basic_salary", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(length = 200)
    private String qualification;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;

    @Column(name = "annual_leave_quota", nullable = false)
    @Builder.Default
    private Integer annualLeaveQuota = 14;

    @Column(name = "casual_leave_quota", nullable = false)
    @Builder.Default
    private Integer casualLeaveQuota = 7;

    @Column(name = "sick_leave_quota", nullable = false)
    @Builder.Default
    private Integer sickLeaveQuota = 7;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by")
    private User registeredBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

