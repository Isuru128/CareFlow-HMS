package lk.careflow.service.patient;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.patient.CreateMedicalHistoryRequest;
import lk.careflow.dto.patient.MedicalHistoryResponse;
import lk.careflow.dto.patient.UpdateMedicalHistoryRequest;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientMedicalHistory;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.patient.PatientMedicalHistoryRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.service.user.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientMedicalHistoryServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientMedicalHistoryRepository medicalHistoryRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private PatientMedicalHistoryService medicalHistoryService;

    private User testDoctor;
    private Patient testPatient;
    private PatientMedicalHistory sampleHistory;

    @BeforeEach
    void setUp() {
        testDoctor = User.builder()
                .id(2L)
                .username("drsmith")
                .firstName("Alice")
                .lastName("Smith")
                .build();

        testPatient = Patient.builder()
                .id(10L)
                .patientNumber("PAT-10001")
                .firstName("John")
                .lastName("Doe")
                .build();

        sampleHistory = PatientMedicalHistory.builder()
                .id(100L)
                .patient(testPatient)
                .conditionOrDiagnosis("Hypertension")
                .diagnosisDate(LocalDate.of(2023, 5, 10))
                .treatment("Dietary changes and medication")
                .medications("Amlodipine 5mg")
                .recordedBy(testDoctor)
                .build();
    }

    @Test
    void testAddMedicalHistory_Success() {
        CreateMedicalHistoryRequest request = CreateMedicalHistoryRequest.builder()
                .conditionOrDiagnosis("Hypertension")
                .diagnosisDate(LocalDate.of(2023, 5, 10))
                .treatment("Dietary changes and medication")
                .medications("Amlodipine 5mg")
                .build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));
        when(medicalHistoryRepository.save(any(PatientMedicalHistory.class))).thenAnswer(invocation -> {
            PatientMedicalHistory h = invocation.getArgument(0);
            h.setId(101L);
            return h;
        });

        MedicalHistoryResponse response = medicalHistoryService.addMedicalHistory(10L, request, testDoctor, httpRequest);

        assertNotNull(response);
        assertEquals("Hypertension", response.getConditionOrDiagnosis());
        assertEquals("PAT-10001", response.getPatientNumber());
        assertEquals("Alice Smith", response.getRecordedByName());
        verify(auditLogService, times(1)).log(eq(testDoctor), eq("MEDICAL_HISTORY_ADDED"), eq("PATIENT_MEDICAL_HISTORY"), anyString(), anyString(), eq(httpRequest));
    }

    @Test
    void testGetMedicalHistoriesByPatientId_Success() {
        when(patientRepository.existsById(10L)).thenReturn(true);
        when(medicalHistoryRepository.findByPatientIdOrderByDiagnosisDateDescCreatedAtDesc(10L))
                .thenReturn(List.of(sampleHistory));

        List<MedicalHistoryResponse> result = medicalHistoryService.getMedicalHistoriesByPatientId(10L);

        assertEquals(1, result.size());
        assertEquals("Hypertension", result.get(0).getConditionOrDiagnosis());
    }

    @Test
    void testUpdateMedicalHistory_Success() {
        UpdateMedicalHistoryRequest request = UpdateMedicalHistoryRequest.builder()
                .conditionOrDiagnosis("Essential Hypertension")
                .diagnosisDate(LocalDate.of(2023, 5, 10))
                .treatment("Updated treatment plan")
                .medications("Amlodipine 10mg")
                .build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));
        when(medicalHistoryRepository.findByIdAndPatientId(100L, 10L)).thenReturn(Optional.of(sampleHistory));
        when(medicalHistoryRepository.save(any(PatientMedicalHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MedicalHistoryResponse response = medicalHistoryService.updateMedicalHistory(10L, 100L, request, testDoctor, httpRequest);

        assertNotNull(response);
        assertEquals("Essential Hypertension", response.getConditionOrDiagnosis());
        assertEquals("Amlodipine 10mg", response.getMedications());
        verify(auditLogService, times(1)).log(eq(testDoctor), eq("MEDICAL_HISTORY_UPDATED"), eq("PATIENT_MEDICAL_HISTORY"), eq("100"), anyString(), eq(httpRequest));
    }

    @Test
    void testDeleteMedicalHistory_Success() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(testPatient));
        when(medicalHistoryRepository.findByIdAndPatientId(100L, 10L)).thenReturn(Optional.of(sampleHistory));

        medicalHistoryService.deleteMedicalHistory(10L, 100L, testDoctor, httpRequest);

        verify(medicalHistoryRepository, times(1)).delete(sampleHistory);
        verify(auditLogService, times(1)).log(eq(testDoctor), eq("MEDICAL_HISTORY_DELETED"), eq("PATIENT_MEDICAL_HISTORY"), eq("100"), anyString(), eq(httpRequest));
    }
}
