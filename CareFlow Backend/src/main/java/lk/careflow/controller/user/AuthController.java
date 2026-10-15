package lk.careflow.controller.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.user.*;
import lk.careflow.entity.user.User;
import lk.careflow.service.user.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest, request);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logoutUser(@RequestBody(required = false) TokenRefreshRequest request, HttpServletRequest httpRequest) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        authService.logout(refreshToken, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Log out successful!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String resetToken = authService.generatePasswordResetToken(request, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Password reset token generated: " + resetToken));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        authService.resetPassword(request, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Password has been reset successfully. You can now log in."));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal User userDetails,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.changePassword(userDetails.getId(), request, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
    }
}
