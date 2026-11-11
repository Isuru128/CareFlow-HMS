package lk.careflow.repository.staff;

import lk.careflow.entity.staff.EmploymentType;
import lk.careflow.entity.staff.ShiftType;
import lk.careflow.entity.staff.StaffEmployee;
import lk.careflow.entity.staff.StaffRoleCategory;
import lk.careflow.entity.staff.StaffStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffEmployeeRepository extends JpaRepository<StaffEmployee, Long> {

    Optional<StaffEmployee> findByEmployeeNumber(String employeeNumber);

    Optional<StaffEmployee> findTopByOrderByIdDesc();

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT COUNT(e) > 0 FROM StaffEmployee e WHERE LOWER(e.nicOrPassport) = LOWER(:nicOrPassport)")
    boolean existsByNicOrPassportIgnoreCase(@Param("nicOrPassport") String nicOrPassport);

    long countByStatus(StaffStatus status);

    long countByDepartmentId(Long departmentId);

    long countByRoleCategory(StaffRoleCategory roleCategory);

    List<StaffEmployee> findAllByOrderByFirstNameAscLastNameAsc();

    List<StaffEmployee> findByDepartmentIdOrderByFirstNameAsc(Long departmentId);

    @Query("SELECT COALESCE(SUM(e.basicSalary), 0) FROM StaffEmployee e WHERE e.status IN ('ACTIVE', 'ON_LEAVE')")
    BigDecimal sumActiveMonthlyPayroll();

    @Query("SELECT e FROM StaffEmployee e " +
           "JOIN e.department d " +
           "WHERE (:departmentId IS NULL OR d.id = :departmentId) AND " +
           "(:roleCategory IS NULL OR e.roleCategory = :roleCategory) AND " +
           "(:employmentType IS NULL OR e.employmentType = :employmentType) AND " +
           "(:shiftType IS NULL OR e.shiftType = :shiftType) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.designation) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.nicOrPassport) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<StaffEmployee> searchEmployees(
            @Param("query") String query,
            @Param("departmentId") Long departmentId,
            @Param("roleCategory") StaffRoleCategory roleCategory,
            @Param("employmentType") EmploymentType employmentType,
            @Param("shiftType") ShiftType shiftType,
            @Param("status") StaffStatus status,
            Pageable pageable);
}

