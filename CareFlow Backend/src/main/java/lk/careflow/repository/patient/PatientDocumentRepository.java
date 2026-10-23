package lk.careflow.repository.patient;

import lk.careflow.entity.patient.DocumentType;
import lk.careflow.entity.patient.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientDocumentRepository extends JpaRepository<PatientDocument, Long> {

    List<PatientDocument> findByPatientIdOrderByUploadedAtDesc(Long patientId);

    List<PatientDocument> findByPatientIdAndDocumentTypeOrderByUploadedAtDesc(Long patientId, DocumentType documentType);

    Optional<PatientDocument> findByIdAndPatientId(Long id, Long patientId);

    long countByPatientId(Long patientId);
}
