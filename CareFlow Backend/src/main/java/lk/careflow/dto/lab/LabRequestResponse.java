package lk.careflow.dto.lab;

import lk.careflow.entity.lab.LabPriority;
import lk.careflow.entity.lab.LabRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabRequestResponse {
    private Long id;
    private String requestNumber;
    private Long patientId;
    private String patientNumber;
    private String patientName;
    private String patientGender;
    private Integer patientAge;
    private Long doctorId;
    private String doctorName;
    private LabPriority priority;
    private LabRequestStatus status;
    private String clinicalNotes;
    private Instant requestedAt;
    private int itemCount;
    private List<String> testNames;
    private boolean sampleCollected;
    private boolean hasReport;
    private String reportNumber;
}
