package lk.careflow.repository.pharmacy;

import lk.careflow.entity.pharmacy.BatchStatus;
import lk.careflow.entity.pharmacy.MedicineBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    List<MedicineBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    List<MedicineBatch> findByMedicineIdAndStatusOrderByExpiryDateAsc(Long medicineId, BatchStatus status);

    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.id = :medicineId " +
           "AND b.status = 'ACTIVE' AND b.currentQuantity > 0 AND b.expiryDate > :currentDate " +
           "ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findAvailableBatchesForDispensing(
            @Param("medicineId") Long medicineId,
            @Param("currentDate") LocalDate currentDate);

    boolean existsByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);

    Optional<MedicineBatch> findByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);

    // Expired batches
    @Query("SELECT b FROM MedicineBatch b WHERE b.expiryDate <= :currentDate " +
           "AND b.status = 'ACTIVE' ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findExpiredBatches(@Param("currentDate") LocalDate currentDate);

    // Batches expiring within window (e.g. today < expiryDate <= today + X days)
    @Query("SELECT b FROM MedicineBatch b WHERE b.expiryDate > :currentDate " +
           "AND b.expiryDate <= :thresholdDate AND b.status = 'ACTIVE' " +
           "ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findExpiringBatches(
            @Param("currentDate") LocalDate currentDate,
            @Param("thresholdDate") LocalDate thresholdDate);

    @Query("SELECT b FROM MedicineBatch b WHERE " +
           "(:medicineId IS NULL OR b.medicine.id = :medicineId) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:query IS NULL OR (" +
           "LOWER(b.batchNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.medicine.name) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<MedicineBatch> searchBatches(
            @Param("query") String query,
            @Param("medicineId") Long medicineId,
            @Param("status") BatchStatus status,
            Pageable pageable);

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.status = 'ACTIVE' AND b.expiryDate <= :currentDate")
    long countExpiredBatches(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.status = 'ACTIVE' AND b.expiryDate > :currentDate AND b.expiryDate <= :thresholdDate")
    long countExpiringBatches(@Param("currentDate") LocalDate currentDate, @Param("thresholdDate") LocalDate thresholdDate);
}
