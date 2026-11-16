package lk.careflow.dto.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatientRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "First name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "Last name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @Size(max = 10, message = "Blood group must not exceed 10 characters")
    @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-")
    private String bloodGroup;

    @NotBlank(message = "Contact number is required")
    @Size(max = 20, message = "Contact number must not exceed 20 characters")
    @Pattern(regexp = "^(\\+94\\d{9}|\\d{10})$", message = "Contact number must be 10 digits (e.g., 0771234567)")
    private String contactNumber;

    @Email(message = "Email must be valid")
    @Pattern(regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid format (e.g., name@domain.com or name@domain.lk)")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 50, message = "NIC or Passport must not exceed 50 characters")
    @Pattern(regexp = "^$|^([0-9]{9}[VvXx]|[0-9]{12}|[A-Za-z0-9-]{6,15})$", message = "NIC/Passport must be a valid 12-digit NIC, 9-digit+V/X NIC, or Passport number")
    private String nicOrPassport;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
    private String emergencyContactName;

    @Size(max = 20, message = "Emergency contact number must not exceed 20 characters")
    @Pattern(regexp = "^$|^(\\+94\\d{9}|\\d{10})$", message = "Emergency contact number must be 10 digits (e.g., 0771234567)")
    private String emergencyContactNumber;

    @Size(max = 50, message = "Emergency contact relation must not exceed 50 characters")
    private String emergencyContactRelation;

    @Size(max = 500, message = "Allergies must not exceed 500 characters")
    private String allergies;

    private PatientStatus status;
}
