package lk.careflow.dto.doctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private String contactNumber;
    private boolean isActive;
    private long doctorCount;
    private Instant createdAt;
    private Instant updatedAt;
}
