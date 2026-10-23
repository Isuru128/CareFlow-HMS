package lk.careflow.repository.patient;

import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByPatientNumber(String patientNumber);

    Optional<Patient> findByPatientNumber(String patientNumber);

    Optional<Patient> findTopByOrderByIdDesc();

    @Query("SELECT p FROM Patient p WHERE " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.contactNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.nicOrPassport) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:gender IS NULL OR p.gender = :gender)")
    Page<Patient> searchPatients(
            @Param("query") String query,
            @Param("status") PatientStatus status,
            @Param("gender") Gender gender,
            Pageable pageable);

    long countByStatus(PatientStatus status);

    long countByCreatedAtAfter(Instant instant);
}
