package lk.careflow.repository.billing;

import lk.careflow.entity.billing.Admission;
import lk.careflow.entity.billing.AdmissionStatus;
import lk.careflow.entity.billing.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    Optional<Admission> findByAdmissionNumber(String admissionNumber);

    Optional<Admission> findTopByOrderByIdDesc();

    List<Admission> findByPatientIdOrderByAdmissionDateDesc(Long patientId);

    long countByStatus(AdmissionStatus status);

    @Query("SELECT a FROM Admission a " +
           "JOIN a.patient p " +
           "LEFT JOIN a.attendingDoctor d " +
           "WHERE (:patientId IS NULL OR p.id = :patientId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:roomType IS NULL OR a.roomType = :roomType) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(a.admissionNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.wardName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.bedNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<Admission> searchAdmissions(
            @Param("query") String query,
            @Param("patientId") Long patientId,
            @Param("status") AdmissionStatus status,
            @Param("roomType") RoomType roomType,
            Pageable pageable);
}

