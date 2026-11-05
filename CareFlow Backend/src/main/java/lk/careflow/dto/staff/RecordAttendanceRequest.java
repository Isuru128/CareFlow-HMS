package lk.careflow.dto.staff;

import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.staff.AttendanceStatus;
import lk.careflow.entity.staff.ShiftType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordAttendanceRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private LocalDate attendanceDate;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private ShiftType shiftType;

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;

    private BigDecimal workingHours;
    private BigDecimal overtimeHours;
    private String remarks;
}

