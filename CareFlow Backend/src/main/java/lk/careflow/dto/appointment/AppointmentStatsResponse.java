package lk.careflow.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatsResponse {

    private long totalAppointments;
    private long todayAppointments;
    private long todayScheduled;
    private long todayConfirmed;
    private long todayInProgress;
    private long todayCompleted;
    private long todayCancelled;
    private long upcomingAppointments;
    private Map<String, Long> statusCounts;
}
