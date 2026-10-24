package lk.careflow.dto.doctor;

import lk.careflow.entity.doctor.DoctorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private Long id;
    private String doctorNumber;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String specialization;
    private String licenseNumber;
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    private String qualification;
    private Integer experienceYears;
    private String contactNumber;
    private String email;
    private BigDecimal consultationFee;
    private String roomNumber;
    private String bio;
    private DoctorStatus status;
    private Long registeredById;
    private String registeredByName;
    private long totalAppointments;
    private List<DoctorScheduleResponse> schedules;
    private Instant createdAt;
    private Instant updatedAt;
}
