package lk.careflow.service.doctor;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.doctor.DepartmentRequest;
import lk.careflow.dto.doctor.DepartmentResponse;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.service.user.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private DepartmentService departmentService;

    private User adminUser;
    private Department sampleDepartment;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .firstName("Admin")
                .lastName("User")
                .build();

        sampleDepartment = Department.builder()
                .id(1L)
                .name("Cardiology")
                .code("CARD")
                .description("Heart and cardiovascular care")
                .contactNumber("+94112345678")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void getAllDepartments_ShouldReturnList() {
        when(departmentRepository.findAllByOrderByNameAsc()).thenReturn(List.of(sampleDepartment));
        when(doctorRepository.countByDepartmentId(1L)).thenReturn(3L);

        List<DepartmentResponse> result = departmentService.getAllDepartments(false);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Cardiology", result.get(0).getName());
        assertEquals(3L, result.get(0).getDoctorCount());
    }

    @Test
    void getDepartmentById_WhenFound_ShouldReturnResponse() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(doctorRepository.countByDepartmentId(1L)).thenReturn(2L);

        DepartmentResponse response = departmentService.getDepartmentById(1L);

        assertNotNull(response);
        assertEquals("CARD", response.getCode());
    }

    @Test
    void getDepartmentById_WhenNotFound_ShouldThrowException() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> departmentService.getDepartmentById(99L));
    }

    @Test
    void createDepartment_Success() {
        DepartmentRequest request = DepartmentRequest.builder()
                .name("Neurology")
                .code("NEUR")
                .description("Brain and nervous system")
                .build();

        when(departmentRepository.existsByCodeIgnoreCase("NEUR")).thenReturn(false);
        when(departmentRepository.existsByNameIgnoreCase("Neurology")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department d = invocation.getArgument(0);
            d.setId(2L);
            return d;
        });

        DepartmentResponse response = departmentService.createDepartment(request, adminUser, httpRequest);

        assertNotNull(response);
        assertEquals("NEUR", response.getCode());
        verify(auditLogService, times(1)).log(eq(adminUser), eq("CREATE_DEPARTMENT"), eq("Department"), eq("2"), anyString(), eq(httpRequest));
    }

    @Test
    void createDepartment_DuplicateCode_ShouldThrowException() {
        DepartmentRequest request = DepartmentRequest.builder()
                .name("Cardiology Modern")
                .code("CARD")
                .build();

        when(departmentRepository.existsByCodeIgnoreCase("CARD")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> departmentService.createDepartment(request, adminUser, httpRequest));
    }

    @Test
    void deleteDepartment_WithAssignedDoctors_ShouldThrowException() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(sampleDepartment));
        when(doctorRepository.countByDepartmentId(1L)).thenReturn(2L);

        assertThrows(BadRequestException.class, () -> departmentService.deleteDepartment(1L, adminUser, httpRequest));
        verify(departmentRepository, never()).delete(any());
    }
}
