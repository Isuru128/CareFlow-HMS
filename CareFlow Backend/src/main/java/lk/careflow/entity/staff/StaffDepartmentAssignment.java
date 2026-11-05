package lk.careflow.entity.staff;

import jakarta.persistence.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.user.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "staff_department_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDepartmentAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StaffEmployee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_department_id")
    private Department fromDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_department_id", nullable = false)
    private Department toDepartment;

    @Column(name = "previous_designation", length = 100)
    private String previousDesignation;

    @Column(name = "new_designation", length = 100, nullable = false)
    private String newDesignation;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_shift", length = 30)
    private ShiftType previousShift;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_shift", length = 30, nullable = false)
    private ShiftType newShift;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_type", length = 30, nullable = false)
    @Builder.Default
    private DepartmentAssignmentType assignmentType = DepartmentAssignmentType.TRANSFER;

    @Column(name = "effective_date", nullable = false)
    @Builder.Default
    private LocalDate effectiveDate = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

