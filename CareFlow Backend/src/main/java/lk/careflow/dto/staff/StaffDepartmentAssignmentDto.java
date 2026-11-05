package lk.careflow.dto.staff;

import lk.careflow.entity.staff.DepartmentAssignmentType;
import lk.careflow.entity.staff.ShiftType;
import lk.careflow.entity.staff.StaffRoleCategory;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDepartmentAssignmentDto {
    private Long id;
    private Long employeeId;
    private String employeeNumber;
    private String employeeName;
    private StaffRoleCategory roleCategory;
    private Long fromDepartmentId;
    private String fromDepartmentName;
    private String fromDepartmentCode;
    private Long toDepartmentId;
    private String toDepartmentName;
    private String toDepartmentCode;
    private String previousDesignation;
    private String newDesignation;
    private ShiftType previousShift;
    private ShiftType newShift;
    private DepartmentAssignmentType assignmentType;
    private LocalDate effectiveDate;
    private String reason;
    private String assignedByName;
    private Instant createdAt;
}

