package lk.careflow.repository.emr;

import lk.careflow.entity.emr.MedicalRecord;
import lk.careflow.entity.emr.RecordStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    boolean existsByRecordNumber(String recordNumber);

    Optional<MedicalRecord> findByRecordNumber(String recordNumber);

    Page<MedicalRecord> findByPatientId(Long patientId, Pageable pageable);

    List<MedicalRecord> findByPatientIdOrderByVisitDateDesc(Long patientId);

    long countByStatus(RecordStatus status);

    @Query("SELECT r FROM MedicalRecord r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR r.doctor.id = :doctorId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:startDate IS NULL OR r.visitDate >= :startDate) AND " +
           "(:endDate IS NULL OR r.visitDate <= :endDate) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(r.recordNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.doctor.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.doctor.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.chiefComplaint) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<MedicalRecord> searchMedicalRecords(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") RecordStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);
}
