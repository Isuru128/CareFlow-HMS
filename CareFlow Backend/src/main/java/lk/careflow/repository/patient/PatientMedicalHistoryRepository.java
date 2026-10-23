package lk.careflow.repository.patient;

import lk.careflow.entity.patient.PatientMedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientMedicalHistoryRepository extends JpaRepository<PatientMedicalHistory, Long> {

    List<PatientMedicalHistory> findByPatientIdOrderByDiagnosisDateDescCreatedAtDesc(Long patientId);

    Optional<PatientMedicalHistory> findByIdAndPatientId(Long id, Long patientId);

    long countByPatientId(Long patientId);
}
