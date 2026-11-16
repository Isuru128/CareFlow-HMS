package lk.careflow.dto.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.careflow.entity.staff.LeaveType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateLeaveRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Leave type is required")
    private LeaveType leaveType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotBlank(message = "Reason for leave is required")
    @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters")
    private String reason;

    @Size(max = 500, message = "Handover notes must not exceed 500 characters")
    private String handoverNotes;

    @Pattern(regexp = "^$|^(\\+94\\d{9}|\\d{10})$", message = "Emergency contact must be 10 digits (e.g., 0771234567)")
    private String emergencyContact;
}

