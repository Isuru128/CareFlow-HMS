package lk.careflow.repository.emr;

import lk.careflow.entity.emr.TreatmentCategory;
import lk.careflow.entity.emr.TreatmentHistory;
import lk.careflow.entity.emr.TreatmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentHistoryRepository extends JpaRepository<TreatmentHistory, Long> {

    List<TreatmentHistory> findByPatientIdOrderByStartDateDesc(Long patientId);

    List<TreatmentHistory> findByMedicalRecordId(Long medicalRecordId);

    long countByStatus(TreatmentStatus status);

    @Query("SELECT t FROM TreatmentHistory t WHERE " +
           "(:patientId IS NULL OR t.patient.id = :patientId) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(t.treatmentName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(t.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(t.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(t.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<TreatmentHistory> searchTreatments(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("category") TreatmentCategory category,
            @Param("status") TreatmentStatus status,
            Pageable pageable);
}
