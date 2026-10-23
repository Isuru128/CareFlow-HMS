package lk.careflow.service.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.CreatePatientRequest;
import lk.careflow.dto.patient.PatientResponse;
import lk.careflow.dto.patient.PatientStatsResponse;
import lk.careflow.dto.patient.UpdatePatientRequest;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.patient.PatientDocumentRepository;
import lk.careflow.repository.patient.PatientMedicalHistoryRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientMedicalHistoryRepository medicalHistoryRepository;

    @Mock
    private PatientDocumentRepository patientDocumentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private PatientService patientService;

    private User testUser;
    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("doctor1")
                .firstName("John")
                .lastName("Smith")
                .build();

        samplePatient = Patient.builder()
                .id(10L)
                .patientNumber("PAT-10001")
                .firstName("Jane")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.FEMALE)
                .bloodGroup("O+")
                .contactNumber("+94771234567")
                .email("jane.doe@example.com")
                .status(PatientStatus.ACTIVE)
                .registeredBy(testUser)
                .build();
    }

    @Test
    void testCreatePatient_WithGeneratedNumber() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.FEMALE)
                .bloodGroup("o+")
                .contactNumber("+94771234567")
                .email("jane.doe@example.com")
                .build();

        when(patientRepository.findTopByOrderByIdDesc()).thenReturn(Optional.of(samplePatient));
        when(patientRepository.existsByPatientNumber("PAT-10011")).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient p = invocation.getArgument(0);
            p.setId(11L);
            return p;
        });

        PatientResponse response = patientService.createPatient(request, testUser, httpRequest);

        assertNotNull(response);
        assertEquals("PAT-10011", response.getPatientNumber());
        assertEquals("Jane", response.getFirstName());
        assertEquals("O+", response.getBloodGroup());
        assertEquals(PatientStatus.ACTIVE, response.getStatus());
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_REGISTERED"), eq("PATIENT"), anyString(), anyString(), eq(httpRequest));
    }

    @Test
    void testCreatePatient_InvalidBloodGroup_ThrowsBadRequest() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.FEMALE)
                .bloodGroup("INVALID_BG")
                .contactNumber("+94771234567")
                .build();

        assertThrows(BadRequestException.class, () -> patientService.createPatient(request, testUser, httpRequest));
        verify(patientRepository, never()).save(any());
    }

    @Test
    void testCreatePatient_CustomDuplicateNumber_ThrowsBadRequest() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .patientNumber("PAT-10001")
                .firstName("Jane")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.FEMALE)
                .contactNumber("+94771234567")
                .build();

        when(patientRepository.existsByPatientNumber("PAT-10001")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> patientService.createPatient(request, testUser, httpRequest));
    }

    @Test
    void testGetPatientById_Found() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));
        when(medicalHistoryRepository.countByPatientId(10L)).thenReturn(2L);
        when(patientDocumentRepository.countByPatientId(10L)).thenReturn(3L);

        PatientResponse response = patientService.getPatientById(10L);

        assertNotNull(response);
        assertEquals("PAT-10001", response.getPatientNumber());
        assertEquals(2L, response.getTotalMedicalHistories());
        assertEquals(3L, response.getTotalDocuments());
    }

    @Test
    void testGetPatientById_NotFound_ThrowsException() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientService.getPatientById(999L));
    }

    @Test
    void testUpdatePatient_Success() {
        UpdatePatientRequest updateRequest = UpdatePatientRequest.builder()
                .firstName("Jane Updated")
                .lastName("Doe Updated")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.FEMALE)
                .bloodGroup("A+")
                .contactNumber("+94779999999")
                .status(PatientStatus.INACTIVE)
                .build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PatientResponse response = patientService.updatePatient(10L, updateRequest, testUser, httpRequest);

        assertNotNull(response);
        assertEquals("Jane Updated", response.getFirstName());
        assertEquals(PatientStatus.INACTIVE, response.getStatus());
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_UPDATED"), eq("PATIENT"), eq("10"), anyString(), eq(httpRequest));
    }

    @Test
    void testUpdatePatientStatus_Success() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));

        patientService.updatePatientStatus(10L, PatientStatus.DECEASED, testUser, httpRequest);

        assertEquals(PatientStatus.DECEASED, samplePatient.getStatus());
        verify(patientRepository, times(1)).save(samplePatient);
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_STATUS_UPDATED"), eq("PATIENT"), eq("10"), anyString(), eq(httpRequest));
    }

    @Test
    void testDeletePatient_Success() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));

        patientService.deletePatient(10L, testUser, httpRequest);

        verify(patientRepository, times(1)).delete(samplePatient);
        verify(auditLogService, times(1)).log(eq(testUser), eq("PATIENT_DELETED"), eq("PATIENT"), eq("10"), anyString(), eq(httpRequest));
    }

    @Test
    void testSearchPatients() {
        Pageable pageable = PageRequest.of(0, 10);
        when(patientRepository.searchPatients("Jane", null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(samplePatient), pageable, 1));

        Page<PatientResponse> result = patientService.searchPatients("Jane", null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("PAT-10001", result.getContent().get(0).getPatientNumber());
    }

    @Test
    void testGetPatientStats() {
        when(patientRepository.count()).thenReturn(100L);
        when(patientRepository.countByStatus(PatientStatus.ACTIVE)).thenReturn(85L);
        when(patientRepository.countByStatus(PatientStatus.INACTIVE)).thenReturn(12L);
        when(patientRepository.countByStatus(PatientStatus.DECEASED)).thenReturn(3L);
        when(patientRepository.countByCreatedAtAfter(any())).thenReturn(5L);

        PatientStatsResponse stats = patientService.getPatientStats();

        assertEquals(100L, stats.getTotalPatients());
        assertEquals(85L, stats.getActivePatients());
        assertEquals(12L, stats.getInactivePatients());
        assertEquals(3L, stats.getDeceasedPatients());
        assertEquals(5L, stats.getNewPatientsToday());
    }
}
