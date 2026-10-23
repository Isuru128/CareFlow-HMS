package lk.careflow.controller.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.PatientDocumentResponse;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.patient.DocumentType;
import lk.careflow.entity.user.User;
import lk.careflow.service.patient.PatientDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/patients/{patientId}/documents")
@RequiredArgsConstructor
public class PatientDocumentController {

    private final PatientDocumentService patientDocumentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'LABORATORY_STAFF', 'RECEPTIONIST')")
    public ResponseEntity<PatientDocumentResponse> uploadDocument(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentName") String documentName,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {

        PatientDocumentResponse response = patientDocumentService.uploadDocument(
                patientId, file, documentName, documentType, notes, currentUser, httpRequest
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'LABORATORY_STAFF', 'RECEPTIONIST')")
    public ResponseEntity<List<PatientDocumentResponse>> getDocuments(
            @PathVariable Long patientId,
            @RequestParam(required = false) DocumentType documentType) {
        return ResponseEntity.ok(patientDocumentService.getDocumentsByPatientId(patientId, documentType));
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'LABORATORY_STAFF', 'RECEPTIONIST')")
    public ResponseEntity<PatientDocumentResponse> getDocumentById(
            @PathVariable Long patientId,
            @PathVariable Long documentId) {
        return ResponseEntity.ok(patientDocumentService.getDocumentById(patientId, documentId));
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'LABORATORY_STAFF', 'RECEPTIONIST')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long patientId,
            @PathVariable Long documentId) {
        PatientDocumentService.DocumentDownloadPayload download = patientDocumentService.downloadDocument(patientId, documentId);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (download.contentType() != null) {
            try {
                mediaType = MediaType.parseMediaType(download.contentType());
            } catch (Exception ignored) {
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.originalFileName() + "\"")
                .body(download.resource());
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteDocument(
            @PathVariable Long patientId,
            @PathVariable Long documentId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        patientDocumentService.deleteDocument(patientId, documentId, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Patient document deleted successfully"));
    }
}
