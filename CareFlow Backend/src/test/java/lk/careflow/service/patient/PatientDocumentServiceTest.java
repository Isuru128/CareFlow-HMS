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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientDocumentServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientDocumentRepository patientDocumentRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private PatientDocumentService patientDocumentService;

    private User testUser;
    private Patient testPatient;
    private PatientDocument sampleDocument;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(3L)
                .username("nurse1")
                .firstName("Bob")
                .lastName("Taylor")
                .build();

        testPatient = Patient.builder()
                .id(10L)
                .patientNumber("PAT-10001")
                .build();

        sampleDocument = PatientDocument.builder()
                .id(200L)
                .patient(testPatient)
                .documentName("Blood Test Report")
                .documentType(DocumentType.LAB_REPORT)
                .fileName("blood_test.pdf")
                .fileUrl("10/uuid_blood_test.pdf")
                .fileType("application/pdf")
                .fileSize(1024L)
                .uploadedBy(testUser)
                .build();
    }

    @Test
    void testUploadDocument_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "blood_test.pdf",
                "application/pdf",
                "sample data".getBytes()
        );

        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));
        when(fileStorageService.storeFile(file, "10")).thenReturn("10/uuid_blood_test.pdf");
        when(patientDocumentRepository.save(any(PatientDocument.class))).thenAnswer(invocation -> {
            PatientDocument doc = invocation.getArgument(0);
            doc.setId(201L);
            return doc;
        });

        PatientDocumentResponse response = patientDocumentService.uploadDocument(
                10L,
                file,
                "Blood Test Report",
                DocumentType.LAB_REPORT,
                "Routine checkup",
                testUser,
                httpRequest
        );

        assertNotNull(response);
        assertEquals("Blood Test Report", response.getDocumentName());
        assertEquals(DocumentType.LAB_REPORT, response.getDocumentType());
        assertEquals("blood_test.pdf", response.getFileName());
        assertEquals("Bob Taylor", response.getUploadedByName());
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_DOCUMENT_UPLOADED"), eq("PATIENT_DOCUMENT"), anyString(), anyString(), eq(httpRequest));
    }

    @Test
    void testUploadDocument_MissingName_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "data".getBytes()
        );
        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));

        assertThrows(BadRequestException.class, () ->
                patientDocumentService.uploadDocument(10L, file, "", DocumentType.LAB_REPORT, null, testUser, httpRequest));
    }

    @Test
    void testGetDocumentsByPatientId_FilteredByType() {
        when(patientRepository.existsById(10L)).thenReturn(true);
        when(patientDocumentRepository.findByPatientIdAndDocumentTypeOrderByUploadedAtDesc(10L, DocumentType.LAB_REPORT))
                .thenReturn(List.of(sampleDocument));

        List<PatientDocumentResponse> result = patientDocumentService.getDocumentsByPatientId(10L, DocumentType.LAB_REPORT);

        assertEquals(1, result.size());
        assertEquals(DocumentType.LAB_REPORT, result.get(0).getDocumentType());
    }

    @Test
    void testDownloadDocument_Success() {
        Resource mockResource = new ByteArrayResource("test-bytes".getBytes());
        when(patientRepository.existsById(10L)).thenReturn(true);
        when(patientDocumentRepository.findByIdAndPatientId(200L, 10L)).thenReturn(Optional.of(sampleDocument));
        when(fileStorageService.loadFileAsResource("10/uuid_blood_test.pdf")).thenReturn(mockResource);

        PatientDocumentService.DocumentDownloadPayload payload = patientDocumentService.downloadDocument(10L, 200L);

        assertNotNull(payload);
        assertEquals("blood_test.pdf", payload.originalFileName());
        assertEquals("application/pdf", payload.contentType());
        assertEquals(mockResource, payload.resource());
    }

    @Test
    void testDeleteDocument_Success() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));
        when(patientDocumentRepository.findByIdAndPatientId(200L, 10L)).thenReturn(Optional.of(sampleDocument));

        patientDocumentService.deleteDocument(10L, 200L, testUser, httpRequest);

        verify(patientDocumentRepository, times(1)).delete(sampleDocument);
        verify(fileStorageService, times(1)).deleteFile("10/uuid_blood_test.pdf");
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_DOCUMENT_DELETED"), eq("PATIENT_DOCUMENT"), eq("200"), anyString(), eq(httpRequest));
    }
}
