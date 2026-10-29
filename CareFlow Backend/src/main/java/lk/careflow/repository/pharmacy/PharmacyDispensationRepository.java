package lk.careflow.repository.pharmacy;

import lk.careflow.entity.pharmacy.DispensationStatus;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lk.careflow.entity.pharmacy.PharmacyDispensation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface PharmacyDispensationRepository extends JpaRepository<PharmacyDispensation, Long> {

    Optional<PharmacyDispensation> findByDispensationNumber(String dispensationNumber);

    Optional<PharmacyDispensation> findTopByOrderByIdDesc();

    Optional<PharmacyDispensation> findByPrescriptionId(Long prescriptionId);

    @Query("SELECT d FROM PharmacyDispensation d WHERE " +
           "(:status IS NULL OR d.status = :status) AND " +
           "(:paymentStatus IS NULL OR d.paymentStatus = :paymentStatus) AND " +
           "(:query IS NULL OR (" +
           "LOWER(d.dispensationNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.patientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.doctorName) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<PharmacyDispensation> searchDispensations(
            @Param("query") String query,
            @Param("status") DispensationStatus status,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            Pageable pageable);

    @Query("SELECT COUNT(d) FROM PharmacyDispensation d WHERE d.dispensedAt >= :startOfDay AND d.dispensedAt <= :endOfDay")
    long countTodayDispensations(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("SELECT COALESCE(SUM(d.totalAmount), 0) FROM PharmacyDispensation d " +
           "WHERE d.dispensedAt >= :startOfDay AND d.dispensedAt <= :endOfDay AND d.status = 'COMPLETED'")
    BigDecimal sumTodayRevenue(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("SELECT COALESCE(SUM(d.totalAmount), 0) FROM PharmacyDispensation d WHERE d.status = 'COMPLETED'")
    BigDecimal sumTotalRevenue();
}
