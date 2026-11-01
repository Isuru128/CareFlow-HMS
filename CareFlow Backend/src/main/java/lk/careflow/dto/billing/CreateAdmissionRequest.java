package lk.careflow.dto.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.careflow.entity.billing.RoomType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAdmissionRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long attendingDoctorId;

    private Long departmentId;

    @NotBlank(message = "Ward name is required")
    private String wardName;

    @NotNull(message = "Room type is required")
    private RoomType roomType;

    @NotBlank(message = "Bed number is required")
    private String bedNumber;

    private Instant admissionDate;

    @NotNull(message = "Daily room rate is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Daily room rate cannot be negative")
    private BigDecimal dailyRoomRate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Nursing fee per day cannot be negative")
    private BigDecimal nursingFeePerDay;

    private String admissionReason;
}

