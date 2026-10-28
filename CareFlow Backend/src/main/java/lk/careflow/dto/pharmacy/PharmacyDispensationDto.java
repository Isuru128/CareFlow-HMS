package lk.careflow.dto.pharmacy;

import lk.careflow.entity.pharmacy.DispensationStatus;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyDispensationDto {
    private Long id;
    private String dispensationNumber;
    private Long prescriptionId;
    private String prescriptionNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String doctorName;
    private Long dispensedById;
    private String dispensedByName;
    private Instant dispensedAt;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private DispensationStatus status;
    private String notes;
    private Instant createdAt;
    @Builder.Default
    private List<PharmacyDispensationItemDto> items = new ArrayList<>();
}
