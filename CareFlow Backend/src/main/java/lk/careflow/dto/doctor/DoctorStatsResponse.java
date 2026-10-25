package lk.careflow.dto.doctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorStatsResponse {

    private long totalDoctors;
    private long activeDoctors;
    private long onLeaveDoctors;
    private long inactiveDoctors;
    private long totalDepartments;
    private Map<String, Long> specializationCounts;
}
