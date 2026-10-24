package lk.careflow.dto.appointment;

import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.appointment.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private String appointmentNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientContactNumber;
    private Long doctorId;
    private String doctorNumber;
    private String doctorName;
    private String doctorSpecialization;
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private Integer queueNumber;
    private AppointmentType appointmentType;
    private AppointmentStatus status;
    private String reason;
    private String notes;
    private BigDecimal consultationFee;
    private String cancellationReason;
    private Instant cancelledAt;
    private Long cancelledById;
    private String cancelledByName;
    private Long bookedById;
    private String bookedByName;
    private Instant createdAt;
    private Instant updatedAt;
}
