package lk.careflow.service.appointment;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.appointment.*;
import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.appointment.AppointmentType;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private AppointmentService appointmentService;

    private User receptionistUser;
    private Patient samplePatient;
    private Doctor sampleDoctor;
    private Department sampleDepartment;
    private Appointment sampleAppointment;

    @BeforeEach
    void setUp() {
        receptionistUser = User.builder()
                .id(3L)
                .username("receptionist")
                .firstName("Mary")
                .lastName("Jane")
                .build();

        samplePatient = Patient.builder()
                .id(1L)
                .patientNumber("PAT-10001")
                .firstName("John")
                .lastName("Doe")
                .gender(Gender.MALE)
                .contactNumber("+94771122334")
                .status(PatientStatus.ACTIVE)
                .build();

        sampleDepartment = Department.builder()
                .id(1L)
                .name("Cardiology")
                .code("CARD")
                .build();

        sampleDoctor = Doctor.builder()
                .id(1L)
                .doctorNumber("DOC-10001")
                .firstName("Kumara")
                .lastName("Perera")
                .specialization("Cardiologist")
                .department(sampleDepartment)
                .status(DoctorStatus.ACTIVE)
                .consultationFee(BigDecimal.valueOf(2500))
                .build();

        sampleAppointment = Appointment.builder()
                .id(1L)
                .appointmentNumber("APT-10001")
                .patient(samplePatient)
                .doctor(sampleDoctor)
                .department(sampleDepartment)
                .appointmentDate(LocalDate.now().plusDays(1))
                .appointmentTime(LocalTime.of(10, 0))
                .queueNumber(1)
                .appointmentType(AppointmentType.CONSULTATION)
                .status(AppointmentStatus.SCHEDULED)
                .consultationFee(BigDecimal.valueOf(2500))
                .bookedBy(receptionistUser)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void searchAppointments_ShouldReturnPage() {
        when(appointmentRepository.searchAppointments(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleAppointment)));

        Page<AppointmentResponse> result = appointmentService.searchAppointments(
                null, null, null, null, null, null, null, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("APT-10001", result.getContent().get(0).getAppointmentNumber());
        assertEquals("John Doe", result.getContent().get(0).getPatientName());
        assertEquals("Dr. Kumara Perera", result.getContent().get(0).getDoctorName());
    }

    @Test
    void getAppointmentById_WhenFound_ShouldReturnResponse() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(sampleAppointment));

        AppointmentResponse response = appointmentService.getAppointmentById(1L);

        assertNotNull(response);
        assertEquals("APT-10001", response.getAppointmentNumber());
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());
    }

    @Test
    void getAppointmentById_WhenNotFound_ShouldThrowException() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getAppointmentById(99L));
    }

    @Test
    void bookAppointment_Success() {
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(LocalDate.now().plusDays(2))
                .appointmentTime(LocalTime.of(10, 30))
                .appointmentType(AppointmentType.CONSULTATION)
                .reason("Chest tightness")
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.existsConflictingAppointment(eq(1L), any(), any(), isNull())).thenReturn(false);
        when(appointmentRepository.findMaxQueueNumber(eq(1L), any())).thenReturn(3);
        when(appointmentRepository.findTopByOrderByIdDesc()).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.existsByAppointmentNumber("APT-00002")).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(2L);
            return a;
        });

        AppointmentResponse response = appointmentService.bookAppointment(request, receptionistUser, httpRequest);

        assertNotNull(response);
        assertEquals(4, response.getQueueNumber());
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());
        assertEquals(BigDecimal.valueOf(2500), response.getConsultationFee());
        verify(auditLogService, times(1)).log(eq(receptionistUser), eq("BOOK_APPOINTMENT"), eq("Appointment"), eq("2"), anyString(), eq(httpRequest));
    }

    @Test
    void bookAppointment_ConflictingTime_ShouldThrowException() {
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(LocalDate.now().plusDays(1))
                .appointmentTime(LocalTime.of(10, 0))
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.existsConflictingAppointment(eq(1L), any(), any(), isNull())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> appointmentService.bookAppointment(request, receptionistUser, httpRequest));
    }

    @Test
    void rescheduleAppointment_Success() {
        RescheduleAppointmentRequest request = RescheduleAppointmentRequest.builder()
                .appointmentDate(LocalDate.now().plusDays(3))
                .appointmentTime(LocalTime.of(11, 0))
                .reason("Patient request due to travel")
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.existsConflictingAppointment(eq(1L), any(), any(), eq(1L))).thenReturn(false);
        when(appointmentRepository.findMaxQueueNumber(eq(1L), any())).thenReturn(1);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.rescheduleAppointment(1L, request, receptionistUser, httpRequest);

        assertNotNull(response);
        assertEquals(AppointmentStatus.RESCHEDULED, response.getStatus());
        assertEquals(LocalDate.now().plusDays(3), response.getAppointmentDate());
        assertEquals(LocalTime.of(11, 0), response.getAppointmentTime());
        verify(auditLogService, times(1)).log(eq(receptionistUser), eq("RESCHEDULE_APPOINTMENT"), eq("Appointment"), eq("1"), anyString(), eq(httpRequest));
    }

    @Test
    void cancelAppointment_Success() {
        CancelAppointmentRequest request = CancelAppointmentRequest.builder()
                .cancellationReason("Patient fever resolved")
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.cancelAppointment(1L, request, receptionistUser, httpRequest);

        assertNotNull(response);
        assertEquals(AppointmentStatus.CANCELLED, response.getStatus());
        assertEquals("Patient fever resolved", response.getCancellationReason());
        assertNotNull(response.getCancelledAt());
        verify(auditLogService, times(1)).log(eq(receptionistUser), eq("CANCEL_APPOINTMENT"), eq("Appointment"), eq("1"), anyString(), eq(httpRequest));
    }

    @Test
    void updateAppointmentStatus_Success() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.updateAppointmentStatus(1L, AppointmentStatus.CONFIRMED, receptionistUser, httpRequest);

        assertNotNull(response);
        assertEquals(AppointmentStatus.CONFIRMED, response.getStatus());
        verify(auditLogService, times(1)).log(eq(receptionistUser), eq("UPDATE_APPOINTMENT_STATUS"), eq("Appointment"), eq("1"), anyString(), eq(httpRequest));
    }

    @Test
    void updateAppointmentStatus_OnCancelledAppointment_ShouldThrowException() {
        sampleAppointment.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(sampleAppointment));

        assertThrows(BadRequestException.class, () ->
                appointmentService.updateAppointmentStatus(1L, AppointmentStatus.COMPLETED, receptionistUser, httpRequest));
    }
}
