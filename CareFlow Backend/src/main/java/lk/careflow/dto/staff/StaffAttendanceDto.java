package lk.careflow.dto.staff;

import lk.careflow.entity.staff.AttendanceStatus;
import lk.careflow.entity.staff.ShiftType;
import lk.careflow.entity.staff.StaffRoleCategory;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffAttendanceDto {
    private Long id;
    private Long employeeId;
    private String employeeNumber;
    private String employeeName;
    private String designation;
    private StaffRoleCategory roleCategory;
    private Long departmentId;
    private String departmentName;
    private LocalDate attendanceDate;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private ShiftType shiftType;
    private AttendanceStatus status;
    private BigDecimal workingHours;
    private BigDecimal overtimeHours;
    private String remarks;
    private String recordedByName;
    private Instant createdAt;
    private Instant updatedAt;
}

