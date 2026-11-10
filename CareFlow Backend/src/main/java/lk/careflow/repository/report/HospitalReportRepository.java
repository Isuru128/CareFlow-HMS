package lk.careflow.repository.report;

import lk.careflow.entity.report.HospitalReport;
import lk.careflow.entity.report.ReportCategory;
import lk.careflow.entity.report.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalReportRepository extends JpaRepository<HospitalReport, Long> {

    Optional<HospitalReport> findByReportNumber(String reportNumber);

    Optional<HospitalReport> findTopByOrderByIdDesc();

    long countByReportCategory(ReportCategory reportCategory);

    long countByStatus(ReportStatus status);

    @Query("SELECT r FROM HospitalReport r " +
           "WHERE (:category IS NULL OR r.reportCategory = :category) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(r.reportNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.reportTitle) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.departmentName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.executiveSummary) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<HospitalReport> searchReports(
            @Param("query") String query,
            @Param("category") ReportCategory category,
            @Param("status") ReportStatus status,
            Pageable pageable);
}

