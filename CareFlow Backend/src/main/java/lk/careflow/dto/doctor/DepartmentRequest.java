package lk.careflow.dto.doctor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequest {

    @NotBlank(message = "Department name is required")
    @Size(min = 2, max = 100, message = "Department name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Department code is required")
    @Size(min = 2, max = 20, message = "Department code must be between 2 and 20 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]{2,20}$", message = "Department code can only contain letters, numbers, hyphens, and underscores")
    private String code;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 20, message = "Contact number must not exceed 20 characters")
    @Pattern(regexp = "^$|^(\\+94\\d{9}|\\d{10})$", message = "Contact number must be 10 digits (e.g., 0112345678)")
    private String contactNumber;

    @Builder.Default
    private Boolean isActive = true;
}
