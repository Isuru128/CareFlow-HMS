package lk.careflow.dto.staff;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.staff.EmploymentType;
import lk.careflow.entity.staff.ShiftType;
import lk.careflow.entity.staff.StaffRoleCategory;
import lk.careflow.entity.staff.StaffStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffEmployeeRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "First name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "Last name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String lastName;

    @NotBlank(message = "NIC or Passport number is required")
    @Size(max = 50, message = "NIC or Passport must not exceed 50 characters")
    @Pattern(regexp = "^([0-9]{9}[VvXx]|[0-9]{12}|[A-Za-z0-9-]{6,15})$", message = "NIC/Passport must be a valid 12-digit NIC, 9-digit+V/X NIC, or Passport number")
    private String nicOrPassport;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^(\\+94\\d{9}|\\d{10})$", message = "Contact number must be 10 digits (e.g., 0771234567)")
    private String contactNumber;

    @NotBlank(message = "Email address is required")
    @Email(message = "Valid email address is required")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid format (e.g., staff@careflow.lk or staff@domain.com)")
    private String email;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
    private String emergencyContactName;

    @Pattern(regexp = "^$|^(\\+94\\d{9}|\\d{10})$", message = "Emergency contact number must be 10 digits (e.g., 0771234567)")
    private String emergencyContactNumber;

    @NotNull(message = "Role category is required")
    private StaffRoleCategory roleCategory;

    @NotBlank(message = "Designation / Job title is required")
    @Size(min = 2, max = 100, message = "Designation must be between 2 and 100 characters")
    private String designation;

    @NotNull(message = "Department assignment is required")
    private Long departmentId;

    private EmploymentType employmentType;
    private ShiftType shiftType;
    private LocalDate joinDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Basic salary cannot be negative")
    private BigDecimal basicSalary;

    @Size(max = 200, message = "Qualification must not exceed 200 characters")
    private String qualification;

    private StaffStatus status;

    @Min(value = 0, message = "Annual leave quota cannot be negative")
    @Max(value = 365, message = "Annual leave quota cannot exceed 365 days")
    private Integer annualLeaveQuota;

    @Min(value = 0, message = "Casual leave quota cannot be negative")
    @Max(value = 365, message = "Casual leave quota cannot exceed 365 days")
    private Integer casualLeaveQuota;

    @Min(value = 0, message = "Sick leave quota cannot be negative")
    @Max(value = 365, message = "Sick leave quota cannot exceed 365 days")
    private Integer sickLeaveQuota;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    private Long userId;
}

