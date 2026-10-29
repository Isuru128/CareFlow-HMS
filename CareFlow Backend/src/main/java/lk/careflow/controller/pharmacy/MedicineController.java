package lk.careflow.controller.pharmacy;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.pharmacy.CreateMedicineRequest;
import lk.careflow.dto.pharmacy.MedicineDto;
import lk.careflow.dto.pharmacy.UpdateMedicineRequest;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.pharmacy.DosageForm;
import lk.careflow.entity.pharmacy.MedicineCategory;
import lk.careflow.entity.user.User;
import lk.careflow.service.pharmacy.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/pharmacy/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<Page<MedicineDto>> searchMedicines(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) MedicineCategory category,
            @RequestParam(required = false) DosageForm dosageForm,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 15, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(medicineService.searchMedicines(query, category, dosageForm, isActive, pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineDto>> getActiveMedicines() {
        return ResponseEntity.ok(medicineService.getAllActiveMedicines());
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<MedicineDto>> getLowStockMedicines() {
        return ResponseEntity.ok(medicineService.getLowStockMedicines());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicineDto> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @GetMapping("/code/{medicineCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<MedicineDto> getMedicineByCode(@PathVariable String medicineCode) {
        return ResponseEntity.ok(medicineService.getMedicineByCode(medicineCode));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineDto> createMedicine(
            @Valid @RequestBody CreateMedicineRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MedicineDto created = medicineService.createMedicine(request, currentUser, httpRequest);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineDto> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MessageResponse> deleteMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        medicineService.deleteMedicine(id, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Medicine deactivated successfully"));
    }
}
