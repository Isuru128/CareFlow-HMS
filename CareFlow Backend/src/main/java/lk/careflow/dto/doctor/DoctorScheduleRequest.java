package lk.careflow.dto.doctor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorScheduleRequest {

    @NotNull(message = "Day of week is required")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Max patients is required")
    @Min(value = 1, message = "Max patients must be at least 1")
    @Builder.Default
    private Integer maxPatients = 20;

    @NotNull(message = "Slot duration is required")
    @Min(value = 5, message = "Slot duration must be at least 5 minutes")
    @Builder.Default
    private Integer slotDurationMinutes = 15;

    @Size(max = 30, message = "Room number must not exceed 30 characters")
    private String roomNumber;

    @Builder.Default
    private Boolean isActive = true;
}
