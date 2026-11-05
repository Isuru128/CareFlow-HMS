package lk.careflow.repository.staff;

import lk.careflow.entity.staff.DepartmentAssignmentType;
import lk.careflow.entity.staff.StaffDepartmentAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffDepartmentAssignmentRepository extends JpaRepository<StaffDepartmentAssignment, Long> {

    List<StaffDepartmentAssignment> findByEmployeeIdOrderByEffectiveDateDescCreatedAtDesc(Long employeeId);

    @Query("SELECT a FROM StaffDepartmentAssignment a " +
           "JOIN a.employee e " +
           "JOIN a.toDepartment td " +
           "LEFT JOIN a.fromDepartment fd " +
           "WHERE (:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:departmentId IS NULL OR td.id = :departmentId OR (fd IS NOT NULL AND fd.id = :departmentId)) AND " +
           "(:assignmentType IS NULL OR a.assignmentType = :assignmentType) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.newDesignation) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(td.name) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<StaffDepartmentAssignment> searchAssignments(
            @Param("query") String query,
            @Param("employeeId") Long employeeId,
            @Param("departmentId") Long departmentId,
            @Param("assignmentType") DepartmentAssignmentType assignmentType,
            Pageable pageable);
}

