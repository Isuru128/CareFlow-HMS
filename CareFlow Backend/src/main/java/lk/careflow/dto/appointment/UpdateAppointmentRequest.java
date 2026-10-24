package lk.careflow.dto.appointment;

import lk.careflow.entity.appointment.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAppointmentRequest {

    private AppointmentType appointmentType;

    private String reason;

    private String notes;

    private BigDecimal consultationFee;
}
