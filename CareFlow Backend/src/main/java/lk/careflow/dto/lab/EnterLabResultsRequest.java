package lk.careflow.dto.lab;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnterLabResultsRequest {

    @NotNull(message = "Request item ID is required")
    private Long requestItemId;

    @NotEmpty(message = "At least one result parameter is required")
    @Valid
    private List<LabResultItemRequest> results;
}
