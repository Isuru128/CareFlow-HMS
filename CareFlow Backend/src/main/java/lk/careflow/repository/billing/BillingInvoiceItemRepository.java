package lk.careflow.repository.billing;

import lk.careflow.entity.billing.BillingInvoiceItem;
import lk.careflow.entity.billing.ChargeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface BillingInvoiceItemRepository extends JpaRepository<BillingInvoiceItem, Long> {

    List<BillingInvoiceItem> findByInvoiceIdOrderByIdAsc(Long invoiceId);

    @Query("SELECT COALESCE(SUM(item.subtotal), 0) FROM BillingInvoiceItem item " +
           "JOIN item.invoice inv " +
           "WHERE item.chargeType = :chargeType AND inv.status NOT IN ('CANCELLED', 'DRAFT')")
    BigDecimal sumRevenueByChargeType(@Param("chargeType") ChargeType chargeType);

    @Query("SELECT item.referenceCode FROM BillingInvoiceItem item " +
           "JOIN item.invoice inv " +
           "WHERE inv.patient.id = :patientId AND inv.status <> 'CANCELLED' AND item.referenceCode IS NOT NULL")
    List<String> findBilledReferenceCodesByPatientId(@Param("patientId") Long patientId);
}

