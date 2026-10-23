package lk.careflow.dto.patient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientStatsResponse {

    private long totalPatients;
    private long activePatients;
    private long inactivePatients;
    private long deceasedPatients;
    private long newPatientsToday;
}
