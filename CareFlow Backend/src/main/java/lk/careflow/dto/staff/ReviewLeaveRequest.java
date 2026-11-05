package lk.careflow.dto.staff;

import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.staff.LeaveStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewLeaveRequest {

    @NotNull(message = "Decision status (APPROVED / REJECTED / CANCELLED) is required")
    private LeaveStatus status;

    private String reviewComments;
}

