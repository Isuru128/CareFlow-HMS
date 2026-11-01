package lk.careflow.dto.billing;

import lk.careflow.entity.billing.AdmissionStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DischargeAdmissionRequest {
    private Instant dischargeDate;
    private String dischargeNotes;
    private AdmissionStatus status;
}

