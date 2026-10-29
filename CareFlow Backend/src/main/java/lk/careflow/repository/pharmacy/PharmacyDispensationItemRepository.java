package lk.careflow.repository.pharmacy;

import lk.careflow.entity.pharmacy.PharmacyDispensationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyDispensationItemRepository extends JpaRepository<PharmacyDispensationItem, Long> {
    List<PharmacyDispensationItem> findByDispensationId(Long dispensationId);
}
