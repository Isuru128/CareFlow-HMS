package lk.careflow.repository.emr;

import lk.careflow.entity.emr.DiagnosisStatus;
import lk.careflow.entity.emr.PatientDiagnosis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientDiagnosisRepository extends JpaRepository<PatientDiagnosis, Long> {

    List<PatientDiagnosis> findByPatientIdOrderByDiagnosedDateDesc(Long patientId);

    List<PatientDiagnosis> findByMedicalRecordId(Long medicalRecordId);

    long countByStatus(DiagnosisStatus status);

    @Query("SELECT d FROM PatientDiagnosis d WHERE " +
           "(:patientId IS NULL OR d.patient.id = :patientId) AND " +
           "(:status IS NULL OR d.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(d.diagnosisName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(d.icd10Code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(d.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(d.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(d.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<PatientDiagnosis> searchDiagnoses(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("status") DiagnosisStatus status,
            Pageable pageable);
}
