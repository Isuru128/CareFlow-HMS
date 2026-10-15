package lk.careflow.service.user;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.user.CreateUserRequest;
import lk.careflow.dto.user.UpdateUserRequest;
import lk.careflow.dto.user.UserResponse;
import lk.careflow.entity.user.Role;
import lk.careflow.entity.user.User;
import lk.careflow.entity.user.UserStatus;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.exception.user.UserAlreadyExistsException;
import lk.careflow.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToUserResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username '" + request.getUsername() + "' is already taken");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email '" + request.getEmail() + "' is already in use");
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            roles.add(Role.ROLE_RECEPTIONIST);
        } else {
            request.getRoles().forEach(roleStr -> {
                String normalized = roleStr.startsWith("ROLE_") ? roleStr.toUpperCase() : "ROLE_" + roleStr.toUpperCase();
                try {
                    roles.add(Role.valueOf(normalized));
                } catch (IllegalArgumentException e) {
                    throw new ResourceNotFoundException("Role", "name", roleStr);
                }
            });
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        auditLogService.log(savedUser, "USER_CREATED", "USER", savedUser.getId().toString(),
                "Created new user with username: " + savedUser.getUsername(), httpRequest);

        return mapToUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                user.setStatus(UserStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid user status: " + request.getStatus());
            }
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            request.getRoles().forEach(roleStr -> {
                String normalized = roleStr.startsWith("ROLE_") ? roleStr.toUpperCase() : "ROLE_" + roleStr.toUpperCase();
                try {
                    roles.add(Role.valueOf(normalized));
                } catch (IllegalArgumentException e) {
                    throw new ResourceNotFoundException("Role", "name", roleStr);
                }
            });
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);

        auditLogService.log(updatedUser, "USER_UPDATED", "USER", updatedUser.getId().toString(),
                "Updated user profile for: " + updatedUser.getUsername(), httpRequest);

        return mapToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id, HttpServletRequest httpRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        userRepository.delete(user);

        auditLogService.log(null, "USER_DELETED", "USER", id.toString(),
                "Deleted user: " + user.getUsername(), httpRequest);
    }

    @Transactional
    public void updateUserStatus(Long id, UserStatus status, HttpServletRequest httpRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setStatus(status);
        if (status == UserStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
        }
        userRepository.save(user);

        auditLogService.log(user, "USER_STATUS_CHANGED", "USER", id.toString(),
                "Changed user status to: " + status.name(), httpRequest);
    }

    public UserResponse mapToUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus().name())
                .lastLoginAt(user.getLastLoginAt())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
