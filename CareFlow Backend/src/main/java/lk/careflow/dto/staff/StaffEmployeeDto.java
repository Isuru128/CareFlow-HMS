package lk.careflow.dto.staff;

import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.staff.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffEmployeeDto {
    private Long id;
    private String employeeNumber;
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String nicOrPassport;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String contactNumber;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactNumber;

    private StaffRoleCategory roleCategory;
    private String designation;
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    private EmploymentType employmentType;
    private ShiftType shiftType;
    private LocalDate joinDate;
    private BigDecimal basicSalary;
    private String qualification;
    private StaffStatus status;

    private Integer annualLeaveQuota;
    private Integer casualLeaveQuota;
    private Integer sickLeaveQuota;
    private Integer annualLeaveUsed;
    private Integer casualLeaveUsed;
    private Integer sickLeaveUsed;

    private AttendanceStatus todayAttendanceStatus;
    private LocalTime todayCheckInTime;
    private LocalTime todayCheckOutTime;

    private String notes;
    private String registeredByName;
    private Instant createdAt;
    private Instant updatedAt;
}

