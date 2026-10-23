package lk.careflow.dto.patient;

import lk.careflow.entity.patient.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDocumentResponse {

    private Long id;
    private Long patientId;
    private String patientNumber;
    private String documentName;
    private DocumentType documentType;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String notes;
    private Long uploadedById;
    private String uploadedByName;
    private Instant uploadedAt;
}
