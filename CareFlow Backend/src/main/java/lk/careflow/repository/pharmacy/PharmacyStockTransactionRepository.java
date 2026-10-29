package lk.careflow.repository.pharmacy;

import lk.careflow.entity.pharmacy.PharmacyStockTransaction;
import lk.careflow.entity.pharmacy.StockTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyStockTransactionRepository extends JpaRepository<PharmacyStockTransaction, Long> {

    List<PharmacyStockTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId);

    @Query("SELECT t FROM PharmacyStockTransaction t WHERE " +
           "(:medicineId IS NULL OR t.medicine.id = :medicineId) AND " +
           "(:transactionType IS NULL OR t.transactionType = :transactionType) AND " +
           "(:query IS NULL OR (" +
           "LOWER(t.referenceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.medicine.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.notes) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<PharmacyStockTransaction> searchTransactions(
            @Param("query") String query,
            @Param("medicineId") Long medicineId,
            @Param("transactionType") StockTransactionType transactionType,
            Pageable pageable);
}
