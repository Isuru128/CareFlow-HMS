package lk.careflow.dto.staff;

import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.staff.DepartmentAssignmentType;
import lk.careflow.entity.staff.ShiftType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignDepartmentRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Target department ID is required")
    private Long toDepartmentId;

    private String newDesignation;
    private ShiftType newShift;
    private DepartmentAssignmentType assignmentType;
    private LocalDate effectiveDate;
    private String reason;
}

