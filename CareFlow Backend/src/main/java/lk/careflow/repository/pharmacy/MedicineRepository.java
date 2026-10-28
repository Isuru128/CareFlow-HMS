package lk.careflow.repository.pharmacy;

import lk.careflow.entity.pharmacy.DosageForm;
import lk.careflow.entity.pharmacy.Medicine;
import lk.careflow.entity.pharmacy.MedicineCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByMedicineCode(String medicineCode);

    boolean existsByMedicineCode(String medicineCode);

    Optional<Medicine> findTopByOrderByIdDesc();

    List<Medicine> findByIsActiveTrueOrderByNameAsc();

    @Query("SELECT m FROM Medicine m WHERE " +
           "(:category IS NULL OR m.category = :category) AND " +
           "(:dosageForm IS NULL OR m.dosageForm = :dosageForm) AND " +
           "(:isActive IS NULL OR m.isActive = :isActive) AND " +
           "(:query IS NULL OR (" +
           "LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<Medicine> searchMedicines(
            @Param("query") String query,
            @Param("category") MedicineCategory category,
            @Param("dosageForm") DosageForm dosageForm,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.currentQuantity), 0) FROM MedicineBatch b " +
           "WHERE b.medicine.id = :medicineId AND b.status = 'ACTIVE' AND b.expiryDate > CURRENT_DATE")
    Integer getTotalActiveStockByMedicineId(@Param("medicineId") Long medicineId);

    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND " +
           "(SELECT COALESCE(SUM(b.currentQuantity), 0) FROM MedicineBatch b " +
           " WHERE b.medicine = m AND b.status = 'ACTIVE' AND b.expiryDate > CURRENT_DATE) <= m.reorderLevel")
    List<Medicine> findLowStockMedicines();
}
