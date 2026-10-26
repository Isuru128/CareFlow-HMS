package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, Long> {

    Optional<LabReport> findByReportNumber(String reportNumber);

    Optional<LabReport> findByRequestId(Long requestId);

    boolean existsByReportNumber(String reportNumber);

    @Query("SELECT rpt FROM LabReport rpt " +
           "JOIN rpt.request req " +
           "JOIN req.patient p " +
           "WHERE (:query IS NULL OR (" +
           "LOWER(rpt.reportNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(req.requestNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<LabReport> searchReports(@Param("query") String query, Pageable pageable);
}
