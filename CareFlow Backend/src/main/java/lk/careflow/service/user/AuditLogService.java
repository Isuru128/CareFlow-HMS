package lk.careflow.service.user;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.entity.user.AuditLog;
import lk.careflow.entity.user.User;
import lk.careflow.repository.user.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User user, String action, String entityName, String entityId, String details, HttpServletRequest request) {
        String ipAddress = null;
        String userAgent = null;

        if (request != null) {
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            } else if (ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 250) {
                userAgent = userAgent.substring(0, 250);
            }
        }

        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(log);
    }
}
