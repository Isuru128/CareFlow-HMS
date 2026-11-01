package lk.careflow.dto.billing;

import lk.careflow.entity.billing.AdmissionStatus;
import lk.careflow.entity.billing.RoomType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionDto {
    private Long id;
    private String admissionNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private Long attendingDoctorId;
    private String attendingDoctorName;
    private Long departmentId;
    private String departmentName;
    private String wardName;
    private RoomType roomType;
    private String bedNumber;
    private Instant admissionDate;
    private Instant dischargeDate;
    private Integer lengthOfStayDays;
    private BigDecimal dailyRoomRate;
    private BigDecimal nursingFeePerDay;
    private BigDecimal estimatedTotalAdmissionCharge;
    private String admissionReason;
    private String dischargeNotes;
    private AdmissionStatus status;
    private String admittedByName;
    private Instant createdAt;
}

