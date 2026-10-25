package lk.careflow.repository.emr;

import lk.careflow.entity.emr.Prescription;
import lk.careflow.entity.emr.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    boolean existsByPrescriptionNumber(String prescriptionNumber);

    Optional<Prescription> findByPrescriptionNumber(String prescriptionNumber);

    List<Prescription> findByPatientIdOrderByIssueDateDesc(Long patientId);

    List<Prescription> findByMedicalRecordId(Long medicalRecordId);

    long countByStatus(PrescriptionStatus status);

    @Query("SELECT p FROM Prescription p WHERE " +
           "(:patientId IS NULL OR p.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR p.doctor.id = :doctorId) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(p.prescriptionNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.doctor.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.doctor.lastName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Prescription> searchPrescriptions(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") PrescriptionStatus status,
            Pageable pageable);
}
