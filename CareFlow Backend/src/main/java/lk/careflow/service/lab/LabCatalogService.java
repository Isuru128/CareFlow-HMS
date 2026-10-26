package lk.careflow.service.lab;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.lab.CreateLabTestRequest;
import lk.careflow.dto.lab.LabTestDto;
import lk.careflow.entity.lab.LabCategory;
import lk.careflow.entity.lab.LabTest;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.lab.LabTestRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabCatalogService {

    private final LabTestRepository labTestRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<LabTestDto> searchTests(String query, LabCategory category, Boolean isActive, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return labTestRepository.searchTests(cleanQuery, category, isActive, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<LabTestDto> getAllActiveTests() {
        return labTestRepository.findByIsActiveTrueOrderByTestNameAsc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LabTestDto getTestById(Long id) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));
        return mapToDto(test);
    }

    @Transactional
    public LabTestDto createTest(CreateLabTestRequest request, User currentUser, HttpServletRequest httpRequest) {
        if (labTestRepository.existsByTestCode(request.getTestCode().trim())) {
            throw new BadRequestException("Lab test code '" + request.getTestCode() + "' already exists");
        }

        LabTest test = LabTest.builder()
                .testCode(request.getTestCode().trim().toUpperCase())
                .testName(request.getTestName().trim())
                .category(request.getCategory())
                .sampleType(request.getSampleType())
                .price(request.getPrice())
                .turnaroundTimeHours(request.getTurnaroundTimeHours() != null ? request.getTurnaroundTimeHours() : 24)
                .referenceRange(request.getReferenceRange())
                .unit(request.getUnit())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        LabTest saved = labTestRepository.save(test);

        auditLogService.log(
                currentUser,
                "CREATE_LAB_TEST",
                "LabTest",
                saved.getId().toString(),
                "Created test offering: " + saved.getTestName() + " (" + saved.getTestCode() + ")",
                httpRequest
        );

        return mapToDto(saved);
    }

    @Transactional
    public LabTestDto updateTest(Long id, CreateLabTestRequest request, User currentUser, HttpServletRequest httpRequest) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));

        if (!test.getTestCode().equalsIgnoreCase(request.getTestCode().trim()) &&
                labTestRepository.existsByTestCode(request.getTestCode().trim())) {
            throw new BadRequestException("Lab test code '" + request.getTestCode() + "' already in use");
        }

        test.setTestCode(request.getTestCode().trim().toUpperCase());
        test.setTestName(request.getTestName().trim());
        test.setCategory(request.getCategory());
        test.setSampleType(request.getSampleType());
        test.setPrice(request.getPrice());
        if (request.getTurnaroundTimeHours() != null) {
            test.setTurnaroundTimeHours(request.getTurnaroundTimeHours());
        }
        test.setReferenceRange(request.getReferenceRange());
        test.setUnit(request.getUnit());
        test.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            test.setIsActive(request.getIsActive());
        }

        LabTest updated = labTestRepository.save(test);

        auditLogService.log(
                currentUser,
                "UPDATE_LAB_TEST",
                "LabTest",
                updated.getId().toString(),
                "Updated test: " + updated.getTestName(),
                httpRequest
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteTest(Long id, User currentUser, HttpServletRequest httpRequest) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));

        test.setIsActive(false);
        labTestRepository.save(test);

        auditLogService.log(
                currentUser,
                "DEACTIVATE_LAB_TEST",
                "LabTest",
                test.getId().toString(),
                "Deactivated lab test: " + test.getTestCode(),
                httpRequest
        );
    }

    public LabTestDto mapToDto(LabTest test) {
        return LabTestDto.builder()
                .id(test.getId())
                .testCode(test.getTestCode())
                .testName(test.getTestName())
                .category(test.getCategory())
                .sampleType(test.getSampleType())
                .price(test.getPrice())
                .turnaroundTimeHours(test.getTurnaroundTimeHours())
                .referenceRange(test.getReferenceRange())
                .unit(test.getUnit())
                .description(test.getDescription())
                .isActive(test.getIsActive())
                .createdAt(test.getCreatedAt())
                .build();
    }
}
