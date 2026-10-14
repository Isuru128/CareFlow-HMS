package lk.careflow.service.user;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.config.JwtUtils;
import lk.careflow.config.UserDetailsImpl;
import lk.careflow.dto.user.*;
import lk.careflow.entity.user.PasswordResetToken;
import lk.careflow.entity.user.RefreshToken;
import lk.careflow.entity.user.User;
import lk.careflow.entity.user.UserStatus;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.exception.user.TokenRefreshException;
import lk.careflow.repository.user.PasswordResetTokenRepository;
import lk.careflow.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;

    @Transactional
    public JwtResponse authenticateUser(LoginRequest loginRequest, HttpServletRequest request) {
        User user = userRepository.findByUsernameOrEmail(loginRequest.getUsernameOrEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.SUSPENDED) {
            auditLogService.log(user, "LOGIN_FAILED_LOCKED", "USER", user.getId().toString(), "Attempted login on locked/suspended account", request);
            throw new LockedException("User account is " + user.getStatus().name().toLowerCase() + ". Please contact administrator.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String jwt = jwtUtils.generateJwtToken(authentication);

            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Reset failed login count and record last login timestamp
            user.setFailedLoginAttempts(0);
            user.setLastLoginAt(Instant.now());
            userRepository.save(user);

            auditLogService.log(user, "LOGIN_SUCCESS", "USER", user.getId().toString(), "User logged in successfully", request);

            return JwtResponse.builder()
                    .token(jwt)
                    .refreshToken(refreshToken.getToken())
                    .id(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .firstName(userDetails.getFirstName())
                    .lastName(userDetails.getLastName())
                    .roles(roles)
                    .build();

        } catch (BadCredentialsException e) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= 5) {
                user.setStatus(UserStatus.LOCKED);
                user.setAccountLockedUntil(Instant.now().plus(30, ChronoUnit.MINUTES));
            }
            userRepository.save(user);

            auditLogService.log(user, "LOGIN_FAILED", "USER", user.getId().toString(), "Failed login attempt #" + attempts, request);
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtils.generateTokenFromUsername(user.getUsername());
                    return TokenRefreshResponse.builder()
                            .accessToken(token)
                            .refreshToken(requestRefreshToken)
                            .tokenType("Bearer")
                            .build();
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken, "Refresh token is not in database!"));
    }

    @Transactional
    public void logout(String refreshToken, HttpServletRequest request) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.findByToken(refreshToken).ifPresent(rt -> {
                User user = rt.getUser();
                refreshTokenService.revokeToken(refreshToken);
                auditLogService.log(user, "LOGOUT", "USER", user.getId().toString(), "User logged out", request);
            });
        }
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);

        auditLogService.log(user, "PASSWORD_CHANGED", "USER", user.getId().toString(), "User changed password", httpRequest);
    }

    @Transactional
    public String generatePasswordResetToken(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No user found with email: " + request.getEmail()));

        // Invalidate previous tokens
        passwordResetTokenRepository.findByUserAndUsedFalse(user)
                .ifPresent(existingToken -> {
                    existingToken.setUsed(true);
                    passwordResetTokenRepository.save(existingToken);
                });

        String rawToken = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(rawToken)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        auditLogService.log(user, "PASSWORD_RESET_REQUESTED", "USER", user.getId().toString(), "Password reset requested", httpRequest);

        return rawToken;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid password reset token"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Password reset token is expired or has already been used");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.setStatus(UserStatus.ACTIVE);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditLogService.log(user, "PASSWORD_RESET_COMPLETED", "USER", user.getId().toString(), "Password reset successfully completed", httpRequest);
    }
}
