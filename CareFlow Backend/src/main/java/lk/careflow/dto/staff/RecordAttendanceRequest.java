package lk.careflow.dto.staff;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @DecimalMin(value = "0.0", inclusive = true, message = "Working hours cannot be negative")
    @DecimalMax(value = "24.0", inclusive = true, message = "Working hours cannot exceed 24 hours")
    private BigDecimal workingHours;

    @DecimalMin(value = "0.0", inclusive = true, message = "Overtime hours cannot be negative")
    @DecimalMax(value = "24.0", inclusive = true, message = "Overtime hours cannot exceed 24 hours")
    private BigDecimal overtimeHours;

    @Size(max = 500, message = "Remarks must not exceed 500 characters")
    private String remarks;
}

