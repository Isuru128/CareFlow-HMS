package lk.careflow.repository.billing;

import lk.careflow.entity.billing.BillingInvoice;
import lk.careflow.entity.billing.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {

    Optional<BillingInvoice> findByInvoiceNumber(String invoiceNumber);

    Optional<BillingInvoice> findTopByOrderByIdDesc();

    List<BillingInvoice> findByPatientIdOrderByIssueDateDesc(Long patientId);

    long countByStatus(InvoiceStatus status);

    @Query("SELECT inv FROM BillingInvoice inv " +
           "JOIN inv.patient p " +
           "WHERE (:patientId IS NULL OR p.id = :patientId) AND " +
           "(:status IS NULL OR inv.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(inv.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<BillingInvoice> searchInvoices(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("status") InvoiceStatus status,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(inv.totalAmount), 0) FROM BillingInvoice inv WHERE inv.status NOT IN ('CANCELLED', 'DRAFT')")
    BigDecimal sumTotalBilledAmount();

    @Query("SELECT COALESCE(SUM(inv.paidAmount), 0) FROM BillingInvoice inv WHERE inv.status NOT IN ('CANCELLED', 'DRAFT')")
    BigDecimal sumTotalCollectedAmount();

    @Query("SELECT COALESCE(SUM(inv.balanceDue), 0) FROM BillingInvoice inv WHERE inv.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')")
    BigDecimal sumOutstandingReceivables();
}

