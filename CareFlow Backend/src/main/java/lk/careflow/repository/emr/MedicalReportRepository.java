package lk.careflow.repository.emr;

import lk.careflow.entity.emr.MedicalReport;
import lk.careflow.entity.emr.ReportStatus;
import lk.careflow.entity.emr.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {

    boolean existsByReportNumber(String reportNumber);

    Optional<MedicalReport> findByReportNumber(String reportNumber);

    List<MedicalReport> findByPatientIdOrderByReportDateDesc(Long patientId);

    List<MedicalReport> findByMedicalRecordId(Long medicalRecordId);

    long countByStatus(ReportStatus status);

    @Query("SELECT r FROM MedicalReport r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR r.doctor.id = :doctorId) AND " +
           "(:reportType IS NULL OR r.reportType = :reportType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(r.reportNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.reportTitle) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.doctor.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.doctor.lastName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<MedicalReport> searchReports(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("reportType") ReportType reportType,
            @Param("status") ReportStatus status,
            Pageable pageable);
}
