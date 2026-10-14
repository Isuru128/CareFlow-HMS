package lk.careflow.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private String refreshToken;
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
}
