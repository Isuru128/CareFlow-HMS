package lk.careflow.repository.billing;

import lk.careflow.entity.billing.BillingPayment;
import lk.careflow.entity.billing.BillingPaymentStatus;
import lk.careflow.entity.billing.PaymentMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingPaymentRepository extends JpaRepository<BillingPayment, Long> {

    Optional<BillingPayment> findByPaymentNumber(String paymentNumber);

    Optional<BillingPayment> findTopByOrderByIdDesc();

    List<BillingPayment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);

    List<BillingPayment> findByPatientIdOrderByPaymentDateDesc(Long patientId);

    @Query("SELECT pay FROM BillingPayment pay " +
           "JOIN pay.invoice inv " +
           "JOIN pay.patient p " +
           "WHERE (:invoiceId IS NULL OR inv.id = :invoiceId) AND " +
           "(:patientId IS NULL OR p.id = :patientId) AND " +
           "(:paymentMethod IS NULL OR pay.paymentMethod = :paymentMethod) AND " +
           "(:status IS NULL OR pay.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(pay.paymentNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(inv.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(pay.transactionReference, '')) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<BillingPayment> searchPayments(
            @Param("query") String query,
            @Param("invoiceId") Long invoiceId,
            @Param("patientId") Long patientId,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("status") BillingPaymentStatus status,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(pay.amount), 0) FROM BillingPayment pay " +
           "WHERE pay.paymentDate >= :startOfDay AND pay.paymentDate <= :endOfDay AND pay.status = 'COMPLETED'")
    BigDecimal sumTodayCollections(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("SELECT COUNT(pay) FROM BillingPayment pay " +
           "WHERE pay.paymentDate >= :startOfDay AND pay.paymentDate <= :endOfDay AND pay.status = 'COMPLETED'")
    long countTodayPayments(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);
}

