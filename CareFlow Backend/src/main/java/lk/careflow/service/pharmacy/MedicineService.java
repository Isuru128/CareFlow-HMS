package lk.careflow.service.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.pharmacy.CreateMedicineRequest;
import lk.careflow.dto.pharmacy.MedicineDto;
import lk.careflow.dto.pharmacy.UpdateMedicineRequest;
import lk.careflow.entity.pharmacy.BatchStatus;
import lk.careflow.entity.pharmacy.DosageForm;
import lk.careflow.entity.pharmacy.Medicine;
import lk.careflow.entity.pharmacy.MedicineCategory;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.pharmacy.MedicineBatchRepository;
import lk.careflow.repository.pharmacy.MedicineRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<MedicineDto> searchMedicines(
            String query,
            MedicineCategory category,
            DosageForm dosageForm,
            Boolean isActive,
            Pageable pageable) {
        return medicineRepository.searchMedicines(query, category, dosageForm, isActive, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<MedicineDto> getAllActiveMedicines() {
        return medicineRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineDto> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicineDto getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        return mapToDto(medicine);
    }

    @Transactional(readOnly = true)
    public MedicineDto getMedicineByCode(String medicineCode) {
        Medicine medicine = medicineRepository.findByMedicineCode(medicineCode)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "code", medicineCode));
        return mapToDto(medicine);
    }

    @Transactional
    public MedicineDto createMedicine(CreateMedicineRequest request, User currentUser, HttpServletRequest httpRequest) {
        String code = request.getMedicineCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateMedicineCode();
        } else if (medicineRepository.existsByMedicineCode(code)) {
            throw new BadRequestException("Medicine code already exists: " + code);
        }

        Medicine medicine = Medicine.builder()
                .medicineCode(code)
                .name(request.getName().trim())
                .genericName(request.getGenericName().trim())
                .brandName(request.getBrandName() != null ? request.getBrandName().trim() : null)
                .category(request.getCategory())
                .dosageForm(request.getDosageForm())
                .strength(request.getStrength().trim())
                .unitOfMeasure(request.getUnitOfMeasure() != null && !request.getUnitOfMeasure().trim().isEmpty() ? request.getUnitOfMeasure().trim() : "TABLET")
                .unitPrice(request.getUnitPrice())
                .reorderLevel(request.getReorderLevel())
                .manufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null)
                .storageConditions(request.getStorageConditions() != null ? request.getStorageConditions().trim() : "Store below 25°C in a dry place")
                .description(request.getDescription())
                .sideEffects(request.getSideEffects())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Medicine saved = medicineRepository.save(medicine);

        auditLogService.log(
                currentUser,
                "MEDICINE_CREATED",
                "MEDICINE",
                String.valueOf(saved.getId()),
                "Created new medicine formulary entry: " + saved.getName() + " (" + saved.getMedicineCode() + ")",
                httpRequest
        );

        return mapToDto(saved);
    }

    @Transactional
    public MedicineDto updateMedicine(Long id, UpdateMedicineRequest request, User currentUser, HttpServletRequest httpRequest) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName().trim());
        medicine.setBrandName(request.getBrandName() != null ? request.getBrandName().trim() : null);
        medicine.setCategory(request.getCategory());
        medicine.setDosageForm(request.getDosageForm());
        medicine.setStrength(request.getStrength().trim());
        if (request.getUnitOfMeasure() != null && !request.getUnitOfMeasure().trim().isEmpty()) {
            medicine.setUnitOfMeasure(request.getUnitOfMeasure().trim());
        }
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setReorderLevel(request.getReorderLevel());
        medicine.setManufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null);
        medicine.setStorageConditions(request.getStorageConditions() != null ? request.getStorageConditions().trim() : medicine.getStorageConditions());
        medicine.setDescription(request.getDescription());
        medicine.setSideEffects(request.getSideEffects());
        if (request.getIsActive() != null) {
            medicine.setIsActive(request.getIsActive());
        }

        Medicine updated = medicineRepository.save(medicine);

        auditLogService.log(
                currentUser,
                "MEDICINE_UPDATED",
                "MEDICINE",
                String.valueOf(updated.getId()),
                "Updated medicine: " + updated.getName() + " (" + updated.getMedicineCode() + ")",
                httpRequest
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteMedicine(Long id, User currentUser, HttpServletRequest httpRequest) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        // Soft delete / deactivate
        medicine.setIsActive(false);
        medicineRepository.save(medicine);

        auditLogService.log(
                currentUser,
                "MEDICINE_DEACTIVATED",
                "MEDICINE",
                String.valueOf(id),
                "Deactivated medicine: " + medicine.getName() + " (" + medicine.getMedicineCode() + ")",
                httpRequest
        );
    }

    public MedicineDto mapToDto(Medicine medicine) {
        int totalStock = medicineRepository.getTotalActiveStockByMedicineId(medicine.getId());
        int activeBatches = (int) medicine.getBatches().stream()
                .filter(b -> b.getStatus() == BatchStatus.ACTIVE && b.getExpiryDate().isAfter(LocalDate.now()))
                .count();

        return MedicineDto.builder()
                .id(medicine.getId())
                .medicineCode(medicine.getMedicineCode())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .brandName(medicine.getBrandName())
                .category(medicine.getCategory())
                .dosageForm(medicine.getDosageForm())
                .strength(medicine.getStrength())
                .unitOfMeasure(medicine.getUnitOfMeasure())
                .unitPrice(medicine.getUnitPrice())
                .reorderLevel(medicine.getReorderLevel())
                .manufacturer(medicine.getManufacturer())
                .storageConditions(medicine.getStorageConditions())
                .description(medicine.getDescription())
                .sideEffects(medicine.getSideEffects())
                .isActive(medicine.getIsActive())
                .totalStock(totalStock)
                .isLowStock(totalStock <= medicine.getReorderLevel())
                .activeBatchesCount(activeBatches)
                .createdAt(medicine.getCreatedAt())
                .updatedAt(medicine.getUpdatedAt())
                .build();
    }

    private synchronized String generateMedicineCode() {
        return medicineRepository.findTopByOrderByIdDesc()
                .map(m -> String.format("MED-%05d", m.getId() + 10001))
                .orElse("MED-10001");
    }
}
