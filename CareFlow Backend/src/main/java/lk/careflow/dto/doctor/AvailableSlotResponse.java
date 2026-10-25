package lk.careflow.dto.doctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotResponse {

    private Long doctorId;
    private String doctorName;
    private LocalDate date;
    private String dayOfWeek;
    private boolean isAvailable;
    private Integer totalCapacity;
    private Integer totalBooked;
    private List<TimeSlotInfo> timeSlots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlotInfo {
        private LocalTime time;
        private boolean isAvailable;
    }
}
