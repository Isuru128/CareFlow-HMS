package lk.careflow.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;
    @Builder.Default
    private boolean success = true;

    public MessageResponse(String message) {
        this.message = message;
        this.success = true;
    }
}
