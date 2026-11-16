package lk.careflow.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "First name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z .'-]{2,50}$", message = "Last name can only contain letters, spaces, dots, hyphens, and apostrophes")
    private String lastName;

    @Pattern(regexp = "^$|^(\\+94\\d{9}|\\d{10})$", message = "Phone number must be 10 digits (e.g., 0771234567)")
    private String phoneNumber;

    private String status;

    private Set<String> roles;
}
