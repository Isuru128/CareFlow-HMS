package lk.careflow.service.doctor;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.doctor.AvailableSlotResponse;
import lk.careflow.dto.doctor.DoctorScheduleRequest;
import lk.careflow.dto.doctor.DoctorScheduleResponse;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorSchedule;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.doctor.DoctorScheduleRepository;
import lk.careflow.service.user.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorScheduleServiceTest {

    @Mock
    private DoctorScheduleRepository scheduleRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private DoctorScheduleService scheduleService;

    private User adminUser;
    private Doctor sampleDoctor;
    private DoctorSchedule sampleSchedule;

    @BeforeEach
    void setUp() {
        adminUser = User.builder().id(1L).username("admin").build();

        sampleDoctor = Doctor.builder()
                .id(1L)
                .doctorNumber("DOC-10001")
                .firstName("Kumara")
                .lastName("Perera")
                .status(DoctorStatus.ACTIVE)
                .consultationFee(BigDecimal.valueOf(2500))
                .roomNumber("Room 102")
                .department(Department.builder().id(1L).name("Cardiology").build())
                .build();

        sampleSchedule = DoctorSchedule.builder()
                .id(1L)
                .doctor(sampleDoctor)
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .maxPatients(10)
                .slotDurationMinutes(15)
                .roomNumber("Room 102")
                .isActive(true)
                .build();
    }

    @Test
    void createSchedule_Success() {
        DoctorScheduleRequest request = DoctorScheduleRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .maxPatients(10)
                .slotDurationMinutes(15)
                .build();

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(scheduleRepository.existsOverlappingSchedule(eq(1L), eq(DayOfWeek.MONDAY), any(), any(), isNull()))
                .thenReturn(false);
        when(scheduleRepository.save(any(DoctorSchedule.class))).thenAnswer(inv -> {
            DoctorSchedule s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        DoctorScheduleResponse response = scheduleService.createSchedule(1L, request, adminUser, httpRequest);

        assertNotNull(response);
        assertEquals(DayOfWeek.MONDAY, response.getDayOfWeek());
        assertEquals(LocalTime.of(9, 0), response.getStartTime());
        verify(auditLogService, times(1)).log(eq(adminUser), eq("CREATE_DOCTOR_SCHEDULE"), eq("DoctorSchedule"), eq("10"), anyString(), eq(httpRequest));
    }

    @Test
    void createSchedule_InvalidTimeRange_ShouldThrowException() {
        DoctorScheduleRequest request = DoctorScheduleRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(10, 0))
                .build();

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(BadRequestException.class, () -> scheduleService.createSchedule(1L, request, adminUser, httpRequest));
    }

    @Test
    void createSchedule_OverlappingSchedule_ShouldThrowException() {
        DoctorScheduleRequest request = DoctorScheduleRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 30))
                .endTime(LocalTime.of(11, 30))
                .build();

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(scheduleRepository.existsOverlappingSchedule(eq(1L), eq(DayOfWeek.MONDAY), any(), any(), isNull()))
                .thenReturn(true);

        assertThrows(BadRequestException.class, () -> scheduleService.createSchedule(1L, request, adminUser, httpRequest));
    }

    @Test
    void getAvailableSlots_WhenSlotsAvailable() {
        LocalDate testMonday = LocalDate.of(2026, 10, 26); // Monday
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(scheduleRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(sampleSchedule));
        when(appointmentRepository.countActiveAppointmentsForDoctorOnDate(1L, testMonday)).thenReturn(2L);
        when(appointmentRepository.existsConflictingAppointment(eq(1L), eq(testMonday), any(LocalTime.class), isNull()))
                .thenReturn(false);

        AvailableSlotResponse response = scheduleService.getAvailableSlots(1L, testMonday);

        assertNotNull(response);
        assertTrue(response.isAvailable());
        assertEquals(10, response.getTotalCapacity());
        assertEquals(2, response.getTotalBooked());
        assertFalse(response.getTimeSlots().isEmpty());
    }
}
