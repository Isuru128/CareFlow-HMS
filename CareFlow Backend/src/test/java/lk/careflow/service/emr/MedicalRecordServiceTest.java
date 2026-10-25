package lk.careflow.service.emr;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.emr.*;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.emr.*;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.user.User;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.*;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private PatientDiagnosisRepository patientDiagnosisRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PrescriptionItemRepository prescriptionItemRepository;

    @Mock
    private TreatmentHistoryRepository treatmentHistoryRepository;

    @Mock
    private MedicalReportRepository medicalReportRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private MedicalRecordService medicalRecordService;

    private Patient testPatient;
    private Doctor testDoctor;
    private User testUser;
    private MedicalRecord testRecord;

    @BeforeEach
    void setUp() {
        testPatient = Patient.builder()
                .id(1L)
                .patientNumber("PAT-10001")
                .firstName("John")
                .lastName("Doe")
                .gender(Gender.MALE)
                .bloodGroup("O+")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .contactNumber("+94711234567")
                .allergies("Penicillin")
                .build();

        testDoctor = Doctor.builder()
                .id(1L)
                .doctorNumber("DOC-10001")
                .firstName("Kumara")
                .lastName("Perera")
                .specialization("Cardiology")
                .build();

        testUser = User.builder()
                .id(1L)
                .username("admin")
                .firstName("System")
                .lastName("Admin")
                .build();

        testRecord = MedicalRecord.builder()
                .id(1L)
                .recordNumber("EMR-10001")
                .patient(testPatient)
                .doctor(testDoctor)
                .chiefComplaint("Chest pain and dizziness")
                .examinationNotes("Lungs clear")
                .clinicalNotes("Stage 1 hypertension")
                .bloodPressure("130/85")
                .temperatureCelsius(new BigDecimal("36.8"))
                .heartRateBpm(72)
                .respiratoryRateBpm(16)
                .weightKg(new BigDecimal("75.00"))
                .heightCm(new BigDecimal("175.00"))
                .bmi(new BigDecimal("24.5"))
                .oxygenSaturation(99)
                .status(RecordStatus.FINALIZED)
                .visitDate(Instant.now())
                .createdBy(testUser)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void searchMedicalRecords_ShouldReturnPagedResults() {
        Page<MedicalRecord> page = new PageImpl<>(List.of(testRecord));
        when(medicalRecordRepository.searchMedicalRecords(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        Page<MedicalRecordResponse> result = medicalRecordService.searchMedicalRecords(
                "chest", 1L, 1L, RecordStatus.FINALIZED, null, null, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("EMR-10001", result.getContent().get(0).getRecordNumber());
    }

    @Test
    void getMedicalRecordById_ShouldReturnDetail() {
        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(testRecord));
        when(patientDiagnosisRepository.findByMedicalRecordId(1L)).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByMedicalRecordId(1L)).thenReturn(Collections.emptyList());
        when(treatmentHistoryRepository.findByMedicalRecordId(1L)).thenReturn(Collections.emptyList());
        when(medicalReportRepository.findByMedicalRecordId(1L)).thenReturn(Collections.emptyList());

        MedicalRecordDetailResponse result = medicalRecordService.getMedicalRecordById(1L);

        assertNotNull(result);
        assertEquals("EMR-10001", result.getRecordNumber());
        assertEquals("John Doe", result.getPatientName());
        assertEquals("Dr. Kumara Perera", result.getDoctorName());
    }

    @Test
    void createMedicalRecord_ShouldSaveAndLog() {
        CreateMedicalRecordRequest request = CreateMedicalRecordRequest.builder()
                .patientId(1L)
                .doctorId(1L)
                .chiefComplaint("Severe headache")
                .bloodPressure("120/80")
                .weightKg(new BigDecimal("70.0"))
                .heightCm(new BigDecimal("170.0"))
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(testDoctor));
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(testRecord);
        when(patientDiagnosisRepository.findByMedicalRecordId(any())).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByMedicalRecordId(any())).thenReturn(Collections.emptyList());
        when(treatmentHistoryRepository.findByMedicalRecordId(any())).thenReturn(Collections.emptyList());
        when(medicalReportRepository.findByMedicalRecordId(any())).thenReturn(Collections.emptyList());

        MedicalRecordDetailResponse result = medicalRecordService.createMedicalRecord(request, testUser, httpRequest);

        assertNotNull(result);
        verify(medicalRecordRepository, times(1)).save(any(MedicalRecord.class));
        verify(auditLogService, times(1)).log(eq(testUser), eq("MEDICAL_RECORD_CREATED"), eq("MEDICAL_RECORD"), anyString(), anyString(), eq(httpRequest));
    }

    @Test
    void getPatientEmrSummary_ShouldAggregatePatientHistory() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));
        when(medicalRecordRepository.findByPatientIdOrderByVisitDateDesc(1L)).thenReturn(List.of(testRecord));
        when(patientDiagnosisRepository.findByPatientIdOrderByDiagnosedDateDesc(1L)).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByPatientIdOrderByIssueDateDesc(1L)).thenReturn(Collections.emptyList());
        when(treatmentHistoryRepository.findByPatientIdOrderByStartDateDesc(1L)).thenReturn(Collections.emptyList());
        when(medicalReportRepository.findByPatientIdOrderByReportDateDesc(1L)).thenReturn(Collections.emptyList());

        PatientEmrSummaryResponse summary = medicalRecordService.getPatientEmrSummary(1L);

        assertNotNull(summary);
        assertEquals(1L, summary.getPatientId());
        assertEquals("John Doe", summary.getFullName());
        assertEquals("130/85", summary.getLatestBloodPressure());
    }
}
