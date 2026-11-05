package lk.careflow.repository.staff;

import lk.careflow.entity.staff.AttendanceStatus;
import lk.careflow.entity.staff.ShiftType;
import lk.careflow.entity.staff.StaffAttendance;
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
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {

    Optional<StaffAttendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    List<StaffAttendance> findByAttendanceDateOrderByEmployeeFirstNameAsc(LocalDate attendanceDate);

    List<StaffAttendance> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);

    long countByAttendanceDateAndStatus(LocalDate attendanceDate, AttendanceStatus status);

    long countByAttendanceDate(LocalDate attendanceDate);

    @Query("SELECT a FROM StaffAttendance a " +
           "JOIN a.employee e " +
           "JOIN e.department d " +
           "WHERE (:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:departmentId IS NULL OR d.id = :departmentId) AND " +
           "(:attendanceDate IS NULL OR a.attendanceDate = :attendanceDate) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:shiftType IS NULL OR a.shiftType = :shiftType) AND " +
           "(:query IS NULL OR :query = '' OR (" +
           "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.designation) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<StaffAttendance> searchAttendance(
            @Param("query") String query,
            @Param("employeeId") Long employeeId,
            @Param("departmentId") Long departmentId,
            @Param("attendanceDate") LocalDate attendanceDate,
            @Param("status") AttendanceStatus status,
            @Param("shiftType") ShiftType shiftType,
            Pageable pageable);
}

