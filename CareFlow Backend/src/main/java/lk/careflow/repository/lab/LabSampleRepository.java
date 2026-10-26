package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabSample;
import lk.careflow.entity.lab.SampleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabSampleRepository extends JpaRepository<LabSample, Long> {

    Optional<LabSample> findBySampleBarcode(String sampleBarcode);

    boolean existsBySampleBarcode(String sampleBarcode);

    List<LabSample> findByRequestId(Long requestId);

    List<LabSample> findByStatus(SampleStatus status);

    @Query("SELECT s FROM LabSample s " +
           "JOIN s.request r " +
           "JOIN r.patient p " +
           "WHERE (:status IS NULL OR s.status = :status) AND " +
           "(:query IS NULL OR (" +
           "LOWER(s.sampleBarcode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.requestNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<LabSample> searchSamples(
            @Param("query") String query,
            @Param("status") SampleStatus status,
            Pageable pageable);
}
