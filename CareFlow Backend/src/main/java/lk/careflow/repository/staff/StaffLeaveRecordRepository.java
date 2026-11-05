package lk.careflow.repository.staff;

import lk.careflow.entity.staff.LeaveStatus;
import lk.careflow.entity.staff.LeaveType;
import lk.careflow.entity.staff.StaffLeaveRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffLeaveRecordRepository extends JpaRepository<StaffLeaveRecord, Long> {

    Optional<StaffLeaveRecord> findByLeaveNumber(String leaveNumber);

    Optional<StaffLeaveRecord> findTopByOrderByIdDesc();

    List<StaffLeaveRecord> findByEmployeeIdOrderByStartDateDesc(Long employeeId);

    long countByStatus(LeaveStatus status);

    @Query("SELECT COUNT(l) FROM StaffLeaveRecord l " +
           "WHERE l.status = 'APPROVED' AND :today BETWEEN l.startDate AND l.endDate")
    long countEmployeesOnApprovedLeaveToday(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(l.totalDays), 0) FROM StaffLeaveRecord l " +
           "WHERE l.employee.id = :employeeId AND l.leaveType = :leaveType AND l.status = 'APPROVED'")
    int sumApprovedLeaveDaysByEmployeeAndType(
            @Param("employeeId") Long employeeId,
            @Param("leaveType") LeaveType leaveType);

    @Query("SELECT l FROM StaffLeaveRecord l " +
           "JOIN l.employee e " +
           "JOIN e.department d " +
           "WHERE (:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:departmentId IS NULL OR d.id = :departmentId) AND " +
           "(:leaveType IS NULL OR l.leaveType = :leaveType) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(l.leaveNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.reason) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<StaffLeaveRecord> searchLeaves(
            @Param("query") String query,
            @Param("employeeId") Long employeeId,
            @Param("departmentId") Long departmentId,
            @Param("leaveType") LeaveType leaveType,
            @Param("status") LeaveStatus status,
            Pageable pageable);
}

