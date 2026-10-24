package lk.careflow.dto.appointment;

import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.appointment.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCalendarEventResponse {

    private Long id;
    private String appointmentNumber;
    private String title;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private Integer queueNumber;
    private Long doctorId;
    private String doctorName;
    private Long patientId;
    private String patientName;
    private String departmentName;
    private AppointmentStatus status;
    private AppointmentType type;
}
