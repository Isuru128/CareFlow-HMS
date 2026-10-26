package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {

    List<LabResult> findByRequestItemId(Long requestItemId);

    @Query("SELECT res FROM LabResult res JOIN res.requestItem item WHERE item.request.id = :requestId")
    List<LabResult> findByRequestId(@Param("requestId") Long requestId);
}
