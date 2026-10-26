package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabItemStatus;
import lk.careflow.entity.lab.LabRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabRequestItemRepository extends JpaRepository<LabRequestItem, Long> {

    List<LabRequestItem> findByRequestId(Long requestId);

    @Query("SELECT lri FROM LabRequestItem lri JOIN FETCH lri.labTest WHERE lri.request.id = :requestId")
    List<LabRequestItem> findByRequestIdWithLabTest(@Param("requestId") Long requestId);

    List<LabRequestItem> findByStatus(LabItemStatus status);
}
