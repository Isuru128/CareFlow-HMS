package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabPriority;
import lk.careflow.entity.lab.LabRequest;
import lk.careflow.entity.lab.LabRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface LabRequestRepository extends JpaRepository<LabRequest, Long> {

    Optional<LabRequest> findByRequestNumber(String requestNumber);

    boolean existsByRequestNumber(String requestNumber);

    @Query("SELECT lr FROM LabRequest lr " +
           "JOIN lr.patient p " +
           "LEFT JOIN lr.doctor d " +
           "WHERE (:patientId IS NULL OR p.id = :patientId) AND " +
           "(:doctorId IS NULL OR (d IS NOT NULL AND d.id = :doctorId)) AND " +
           "(:status IS NULL OR lr.status = :status) AND " +
           "(:priority IS NULL OR lr.priority = :priority) AND " +
           "(:startDate IS NULL OR lr.requestedAt >= :startDate) AND " +
           "(:endDate IS NULL OR lr.requestedAt <= :endDate) AND " +
           "(:query IS NULL OR (" +
           "LOWER(lr.requestNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<LabRequest> searchRequests(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") LabRequestStatus status,
            @Param("priority") LabPriority priority,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);

    long countByStatus(LabRequestStatus status);

    @Query("SELECT COUNT(lr) FROM LabRequest lr WHERE lr.priority IN ('URGENT', 'STAT') AND lr.status <> 'COMPLETED' AND lr.status <> 'CANCELLED'")
    long countUrgentStatActive();
}
