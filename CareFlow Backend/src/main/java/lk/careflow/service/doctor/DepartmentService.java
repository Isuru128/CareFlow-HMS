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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments(Boolean activeOnly) {
        List<Department> list = (activeOnly != null && activeOnly)
                ? departmentRepository.findByIsActiveTrueOrderByNameAsc()
                : departmentRepository.findAllByOrderByNameAsc();

        return list.stream()
                .map(this::mapToDepartmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return mapToDepartmentResponse(department);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        String code = request.getCode().trim().toUpperCase();
        String name = request.getName().trim();

        if (departmentRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Department code '" + code + "' already exists");
        }
        if (departmentRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Department name '" + name + "' already exists");
        }

        Department department = Department.builder()
                .name(name)
                .code(code)
                .description(request.getDescription())
                .contactNumber(request.getContactNumber())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Department saved = departmentRepository.save(department);

        auditLogService.log(
                currentUser,
                "CREATE_DEPARTMENT",
                "Department",
                saved.getId().toString(),
                "Created department: " + saved.getName() + " (" + saved.getCode() + ")",
                httpRequest
        );

        return mapToDepartmentResponse(saved);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request, User currentUser, HttpServletRequest httpRequest) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        String code = request.getCode().trim().toUpperCase();
        String name = request.getName().trim();

        if (!department.getCode().equalsIgnoreCase(code) && departmentRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Department code '" + code + "' already exists");
        }
        if (!department.getName().equalsIgnoreCase(name) && departmentRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Department name '" + name + "' already exists");
        }

        department.setName(name);
        department.setCode(code);
        department.setDescription(request.getDescription());
        department.setContactNumber(request.getContactNumber());
        if (request.getIsActive() != null) {
            department.setActive(request.getIsActive());
        }

        Department updated = departmentRepository.save(department);

        auditLogService.log(
                currentUser,
                "UPDATE_DEPARTMENT",
                "Department",
                updated.getId().toString(),
                "Updated department: " + updated.getName() + " (" + updated.getCode() + ")",
                httpRequest
        );

        return mapToDepartmentResponse(updated);
    }

    @Transactional
    public void deleteDepartment(Long id, User currentUser, HttpServletRequest httpRequest) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        long doctorCount = doctorRepository.countByDepartmentId(id);
        if (doctorCount > 0) {
            throw new BadRequestException("Cannot delete department with " + doctorCount + " assigned doctor(s). Reassign them first.");
        }

        departmentRepository.delete(department);

        auditLogService.log(
                currentUser,
                "DELETE_DEPARTMENT",
                "Department",
                id.toString(),
                "Deleted department: " + department.getName(),
                httpRequest
        );
    }

    public DepartmentResponse mapToDepartmentResponse(Department department) {
        long doctorCount = doctorRepository.countByDepartmentId(department.getId());
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .description(department.getDescription())
                .contactNumber(department.getContactNumber())
                .isActive(department.isActive())
                .doctorCount(doctorCount)
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
