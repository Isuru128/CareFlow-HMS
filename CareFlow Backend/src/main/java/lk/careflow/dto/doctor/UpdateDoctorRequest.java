package lk.careflow.dto.doctor;

import jakarta.validation.constraints.*;
import lk.careflow.entity.doctor.DoctorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDoctorRequest {

    private Long userId;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;

    @NotBlank(message = "Specialization is required")
    @Size(max = 100, message = "Specialization must not exceed 100 characters")
    private String specialization;

    @NotBlank(message = "License number is required")
    @Size(max = 50, message = "License number must not exceed 50 characters")
    private String licenseNumber;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotBlank(message = "Qualification is required")
    @Size(max = 150, message = "Qualification must not exceed 150 characters")
    private String qualification;

    @Min(value = 0, message = "Experience years must be 0 or greater")
    private Integer experienceYears;

    @NotBlank(message = "Contact number is required")
    @Size(max = 20, message = "Contact number must not exceed 20 characters")
    private String contactNumber;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Consultation fee must be non-negative")
    private BigDecimal consultationFee;

    @Size(max = 30, message = "Room number must not exceed 30 characters")
    private String roomNumber;

    private String bio;

    private DoctorStatus status;
}
