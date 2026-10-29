package lk.careflow.service.pharmacy;

import lk.careflow.dto.pharmacy.PharmacyDashboardStatsDto;
import lk.careflow.entity.pharmacy.BatchStatus;
import lk.careflow.repository.pharmacy.MedicineBatchRepository;
import lk.careflow.repository.pharmacy.MedicineRepository;
import lk.careflow.repository.pharmacy.PharmacyDispensationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class PharmacyDashboardService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final PharmacyDispensationRepository dispensationRepository;

    @Transactional(readOnly = true)
    public PharmacyDashboardStatsDto getDashboardStats() {
        LocalDate today = LocalDate.now();
        Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long totalMedicines = medicineRepository.count();
        long activeMedicines = medicineRepository.findByIsActiveTrueOrderByNameAsc().size();
        long totalBatches = medicineBatchRepository.count();
        long lowStockCount = medicineRepository.findLowStockMedicines().size();
        long expiredCount = medicineBatchRepository.countExpiredBatches(today);
        long expiringSoonCount = medicineBatchRepository.countExpiringBatches(today, today.plusDays(60));

        long todayDispensations = dispensationRepository.countTodayDispensations(startOfDay, endOfDay);
        BigDecimal todayRev = dispensationRepository.sumTodayRevenue(startOfDay, endOfDay);
        BigDecimal totalRev = dispensationRepository.sumTotalRevenue();

        // Calculate total inventory value
        BigDecimal inventoryValue = medicineBatchRepository.findAll().stream()
                .filter(b -> b.getStatus() == BatchStatus.ACTIVE && b.getCurrentQuantity() > 0 && b.getExpiryDate().isAfter(today))
                .map(b -> (b.getUnitSellingPrice() != null ? b.getUnitSellingPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(b.getCurrentQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PharmacyDashboardStatsDto.builder()
                .totalMedicines(totalMedicines)
                .activeMedicines(activeMedicines)
                .totalBatches(totalBatches)
                .lowStockCount(lowStockCount)
                .expiringSoonCount(expiringSoonCount)
                .expiredCount(expiredCount)
                .todayDispensationsCount(todayDispensations)
                .todayRevenue(todayRev != null ? todayRev : BigDecimal.ZERO)
                .totalRevenue(totalRev != null ? totalRev : BigDecimal.ZERO)
                .totalInventoryValue(inventoryValue)
                .build();
    }
}
