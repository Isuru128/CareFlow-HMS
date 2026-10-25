package lk.careflow.dto.emr;

import lk.careflow.entity.emr.MedicationRoute;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItemResponse {
    private Long id;
    private Long prescriptionId;
    private String medicationName;
    private String dosage;
    private String frequency;
    private MedicationRoute route;
    private String duration;
    private Integer quantity;
    private String instructions;
    private Boolean isDispensed;
}
