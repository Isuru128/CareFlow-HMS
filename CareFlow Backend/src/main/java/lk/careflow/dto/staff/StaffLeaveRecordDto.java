package lk.careflow.dto.staff;

import lk.careflow.entity.staff.LeaveStatus;
import lk.careflow.entity.staff.LeaveType;
import lk.careflow.entity.staff.StaffRoleCategory;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffLeaveRecordDto {
    private Long id;
    private String leaveNumber;
    private Long employeeId;
    private String employeeNumber;
    private String employeeName;
    private String designation;
    private StaffRoleCategory roleCategory;
    private Long departmentId;
    private String departmentName;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private String reason;
    private String handoverNotes;
    private String emergencyContact;
    private LeaveStatus status;
    private String reviewedByName;
    private Instant reviewedAt;
    private String reviewComments;
    private String requestedByName;
    private Instant createdAt;
    private Instant updatedAt;
}

