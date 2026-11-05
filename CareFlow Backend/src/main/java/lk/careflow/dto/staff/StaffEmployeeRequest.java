package lk.careflow.dto.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "NIC or Passport number is required")
    private String nicOrPassport;

    @NotNull(message = "Gender is required")
    private Gender gender;

    private LocalDate dateOfBirth;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    @NotBlank(message = "Email address is required")
    @Email(message = "Valid email address is required")
    private String email;

    private String address;
    private String emergencyContactName;
    private String emergencyContactNumber;

    @NotNull(message = "Role category is required")
    private StaffRoleCategory roleCategory;

    @NotBlank(message = "Designation / Job title is required")
    private String designation;

    @NotNull(message = "Department assignment is required")
    private Long departmentId;

    private EmploymentType employmentType;
    private ShiftType shiftType;
    private LocalDate joinDate;
    private BigDecimal basicSalary;
    private String qualification;
    private StaffStatus status;

    private Integer annualLeaveQuota;
    private Integer casualLeaveQuota;
    private Integer sickLeaveQuota;
    private String notes;
    private Long userId;
}

