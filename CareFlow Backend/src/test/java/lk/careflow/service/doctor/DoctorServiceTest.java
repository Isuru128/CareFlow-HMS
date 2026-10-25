package lk.careflow.service.doctor;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.doctor.CreateDoctorRequest;
import lk.careflow.dto.doctor.DoctorResponse;
import lk.careflow.dto.doctor.DoctorStatsResponse;
import lk.careflow.dto.doctor.UpdateDoctorRequest;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.doctor.DoctorScheduleRepository;
import lk.careflow.repository.user.UserRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DoctorScheduleRepository scheduleRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private DoctorService doctorService;

    private User adminUser;
    private Department department;
    private Doctor sampleDoctor;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .firstName("System")
                .lastName("Admin")
                .build();

        department = Department.builder()
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
                .licenseNumber("SLMC-12345")
                .department(department)
                .qualification("MBBS, MD (Cardiology)")
                .experienceYears(12)
                .contactNumber("+94771234567")
                .email("kumara@careflow.lk")
                .consultationFee(BigDecimal.valueOf(2500.00))
                .roomNumber("Room 102")
                .status(DoctorStatus.ACTIVE)
                .registeredBy(adminUser)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void searchDoctors_ShouldReturnPage() {
        when(doctorRepository.searchDoctors(any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleDoctor)));
        when(appointmentRepository.countByDoctorId(1L)).thenReturn(5L);
        when(scheduleRepository.findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(1L))
                .thenReturn(Collections.emptyList());

        Page<DoctorResponse> result = doctorService.searchDoctors(null, null, null, null, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("DOC-10001", result.getContent().get(0).getDoctorNumber());
        assertEquals("Dr. Kumara Perera", result.getContent().get(0).getFullName());
    }

    @Test
    void getDoctorById_WhenFound_ShouldReturnResponse() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.countByDoctorId(1L)).thenReturn(10L);
        when(scheduleRepository.findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(1L))
                .thenReturn(Collections.emptyList());

        DoctorResponse response = doctorService.getDoctorById(1L);

        assertNotNull(response);
        assertEquals("SLMC-12345", response.getLicenseNumber());
        assertEquals("Cardiology", response.getDepartmentName());
    }

    @Test
    void getDoctorById_WhenNotFound_ShouldThrowException() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> doctorService.getDoctorById(99L));
    }

    @Test
    void createDoctor_Success() {
        CreateDoctorRequest request = CreateDoctorRequest.builder()
                .firstName("Sunil")
                .lastName("Silva")
                .specialization("Pediatrics")
                .licenseNumber("SLMC-99887")
                .departmentId(1L)
                .qualification("MBBS, DCH")
                .experienceYears(8)
                .contactNumber("+94779876543")
                .email("sunil@careflow.lk")
                .consultationFee(BigDecimal.valueOf(2000.00))
                .build();

        when(doctorRepository.existsByLicenseNumber("SLMC-99887")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(doctorRepository.findTopByOrderByIdDesc()).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.existsByDoctorNumber("DOC-00002")).thenReturn(false);
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> {
            Doctor d = invocation.getArgument(0);
            d.setId(2L);
            return d;
        });

        DoctorResponse response = doctorService.createDoctor(request, adminUser, httpRequest);

        assertNotNull(response);
        assertEquals("SLMC-99887", response.getLicenseNumber());
        verify(auditLogService, times(1)).log(eq(adminUser), eq("CREATE_DOCTOR"), eq("Doctor"), eq("2"), anyString(), eq(httpRequest));
    }

    @Test
    void createDoctor_DuplicateLicense_ShouldThrowException() {
        CreateDoctorRequest request = CreateDoctorRequest.builder()
                .licenseNumber("SLMC-12345")
                .build();

        when(doctorRepository.existsByLicenseNumber("SLMC-12345")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> doctorService.createDoctor(request, adminUser, httpRequest));
    }

    @Test
    void updateDoctor_Success() {
        UpdateDoctorRequest request = UpdateDoctorRequest.builder()
                .firstName("Kumara")
                .lastName("Perera")
                .specialization("Senior Cardiologist")
                .licenseNumber("SLMC-12345")
                .departmentId(1L)
                .qualification("MBBS, MD, FRCP")
                .experienceYears(15)
                .contactNumber("+94771234567")
                .consultationFee(BigDecimal.valueOf(3000.00))
                .build();

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        DoctorResponse response = doctorService.updateDoctor(1L, request, adminUser, httpRequest);

        assertNotNull(response);
        assertEquals("Senior Cardiologist", response.getSpecialization());
        assertEquals(BigDecimal.valueOf(3000.00), response.getConsultationFee());
        verify(auditLogService, times(1)).log(eq(adminUser), eq("UPDATE_DOCTOR"), eq("Doctor"), eq("1"), anyString(), eq(httpRequest));
    }

    @Test
    void assignDepartment_Success() {
        Department neuroDept = Department.builder().id(2L).name("Neurology").code("NEUR").build();
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(neuroDept));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        DoctorResponse response = doctorService.assignDepartment(1L, 2L, adminUser, httpRequest);

        assertNotNull(response);
        assertEquals("Neurology", response.getDepartmentName());
        verify(auditLogService, times(1)).log(eq(adminUser), eq("ASSIGN_DEPARTMENT"), eq("Doctor"), eq("1"), anyString(), eq(httpRequest));
    }

    @Test
    void getDoctorStats_ShouldReturnAggregates() {
        when(doctorRepository.count()).thenReturn(10L);
        when(doctorRepository.countByStatus(DoctorStatus.ACTIVE)).thenReturn(8L);
        when(doctorRepository.countByStatus(DoctorStatus.ON_LEAVE)).thenReturn(1L);
        when(doctorRepository.countByStatus(DoctorStatus.INACTIVE)).thenReturn(1L);
        when(departmentRepository.count()).thenReturn(4L);
        when(doctorRepository.findAll()).thenReturn(List.of(sampleDoctor));

        DoctorStatsResponse stats = doctorService.getDoctorStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalDoctors());
        assertEquals(8L, stats.getActiveDoctors());
        assertEquals(4L, stats.getTotalDepartments());
        assertTrue(stats.getSpecializationCounts().containsKey("Cardiologist"));
    }
}
