package lk.careflow.repository.doctor;

import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByDoctorNumber(String doctorNumber);

    boolean existsByLicenseNumber(String licenseNumber);

    Optional<Doctor> findByDoctorNumber(String doctorNumber);

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    Optional<Doctor> findTopByOrderByIdDesc();

    List<Doctor> findByDepartmentId(Long departmentId);

    List<Doctor> findByStatusOrderByFirstNameAscLastNameAsc(DoctorStatus status);

    long countByStatus(DoctorStatus status);

    long countByDepartmentId(Long departmentId);

    @Query("SELECT d FROM Doctor d WHERE " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(d.doctorNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.licenseNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.contactNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:departmentId IS NULL OR d.department.id = :departmentId) AND " +
            "(:specialization IS NULL OR :specialization = '' OR LOWER(d.specialization) = LOWER(:specialization)) AND " +
            "(:status IS NULL OR d.status = :status)")
    Page<Doctor> searchDoctors(
            @Param("query") String query,
            @Param("departmentId") Long departmentId,
            @Param("specialization") String specialization,
            @Param("status") DoctorStatus status,
            Pageable pageable);

    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.status = 'ACTIVE' ORDER BY d.specialization ASC")
    List<String> findDistinctSpecializations();
}
