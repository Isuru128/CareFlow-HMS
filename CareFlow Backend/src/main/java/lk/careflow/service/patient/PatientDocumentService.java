package lk.careflow.service.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.PatientDocumentResponse;
import lk.careflow.entity.patient.DocumentType;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientDocument;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.patient.PatientDocumentRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientDocumentService {

    private final PatientRepository patientRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PatientDocumentResponse> getDocumentsByPatientId(Long patientId, DocumentType documentType) {
        verifyPatientExists(patientId);

        List<PatientDocument> documents;
        if (documentType != null) {
            documents = patientDocumentRepository.findByPatientIdAndDocumentTypeOrderByUploadedAtDesc(patientId, documentType);
        } else {
            documents = patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
        }

        return documents.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PatientDocumentResponse getDocumentById(Long patientId, Long documentId) {
        verifyPatientExists(patientId);
        PatientDocument document = patientDocumentRepository.findByIdAndPatientId(documentId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDocument", "id", documentId));
        return mapToResponse(document);
    }

    @Transactional
    public PatientDocumentResponse uploadDocument(
            Long patientId,
            MultipartFile file,
            String documentName,
            DocumentType documentType,
            String notes,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        if (documentName == null || documentName.trim().isEmpty()) {
            throw new BadRequestException("Document name is required");
        }
        if (documentType == null) {
            throw new BadRequestException("Document type is required");
        }

        String storedRelativePath = fileStorageService.storeFile(file, String.valueOf(patientId));

        PatientDocument document = PatientDocument.builder()
                .patient(patient)
                .documentName(documentName.trim())
                .documentType(documentType)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document")
                .fileUrl(storedRelativePath)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .notes(notes)
                .uploadedBy(currentUser)
                .build();

        PatientDocument saved = patientDocumentRepository.save(document);

        auditLogService.log(
                currentUser,
                "PATIENT_DOCUMENT_UPLOADED",
                "PATIENT_DOCUMENT",
                saved.getId().toString(),
                "Uploaded document '" + saved.getDocumentName() + "' (" + saved.getDocumentType() + ") for patient " + patient.getPatientNumber(),
                httpRequest
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocumentDownloadPayload downloadDocument(Long patientId, Long documentId) {
        verifyPatientExists(patientId);
        PatientDocument document = patientDocumentRepository.findByIdAndPatientId(documentId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDocument", "id", documentId));

        Resource resource = fileStorageService.loadFileAsResource(document.getFileUrl());

        return new DocumentDownloadPayload(resource, document.getFileName(), document.getFileType());
    }

    @Transactional
    public void deleteDocument(Long patientId, Long documentId, User currentUser, HttpServletRequest httpRequest) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        PatientDocument document = patientDocumentRepository.findByIdAndPatientId(documentId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("PatientDocument", "id", documentId));

        String docName = document.getDocumentName();
        String fileUrl = document.getFileUrl();

        // Delete database record first
        patientDocumentRepository.delete(document);

        // Delete physical file
        fileStorageService.deleteFile(fileUrl);

        auditLogService.log(
                currentUser,
                "PATIENT_DOCUMENT_DELETED",
                "PATIENT_DOCUMENT",
                documentId.toString(),
                "Deleted document '" + docName + "' from patient " + patient.getPatientNumber(),
                httpRequest
        );
    }

    private void verifyPatientExists(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient", "id", patientId);
        }
    }

    private PatientDocumentResponse mapToResponse(PatientDocument document) {
        Long uploadedById = null;
        String uploadedByName = null;
        if (document.getUploadedBy() != null) {
            uploadedById = document.getUploadedBy().getId();
            uploadedByName = document.getUploadedBy().getFirstName() + " " + document.getUploadedBy().getLastName();
        }

        return PatientDocumentResponse.builder()
                .id(document.getId())
                .patientId(document.getPatient().getId())
                .patientNumber(document.getPatient().getPatientNumber())
                .documentName(document.getDocumentName())
                .documentType(document.getDocumentType())
                .fileName(document.getFileName())
                .fileUrl(document.getFileUrl())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .notes(document.getNotes())
                .uploadedById(uploadedById)
                .uploadedByName(uploadedByName)
                .uploadedAt(document.getUploadedAt())
                .build();
    }

    public record DocumentDownloadPayload(Resource resource, String originalFileName, String contentType) {}
}
