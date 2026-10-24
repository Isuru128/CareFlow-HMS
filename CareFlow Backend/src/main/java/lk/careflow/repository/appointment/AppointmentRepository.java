package lk.careflow.repository.appointment;

import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.appointment.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByAppointmentNumber(String appointmentNumber);

    Optional<Appointment> findByAppointmentNumber(String appointmentNumber);

    Optional<Appointment> findTopByOrderByIdDesc();

    @Query("SELECT COALESCE(MAX(a.queueNumber), 0) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :appointmentDate")
    int findMaxQueueNumber(@Param("doctorId") Long doctorId, @Param("appointmentDate") LocalDate appointmentDate);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :appointmentDate AND a.status NOT IN ('CANCELLED')")
    long countActiveAppointmentsForDoctorOnDate(@Param("doctorId") Long doctorId, @Param("appointmentDate") LocalDate appointmentDate);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctor.id = :doctorId " +
            "AND a.appointmentDate = :appointmentDate " +
            "AND a.appointmentTime = :appointmentTime " +
            "AND a.status NOT IN ('CANCELLED') " +
            "AND (:excludeId IS NULL OR a.id <> :excludeId)")
    boolean existsConflictingAppointment(
            @Param("doctorId") Long doctorId,
            @Param("appointmentDate") LocalDate appointmentDate,
            @Param("appointmentTime") LocalTime appointmentTime,
            @Param("excludeId") Long excludeId);

    @Query("SELECT a FROM Appointment a WHERE " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(a.appointmentNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.patient.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.patient.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.patient.patientNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.doctor.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.doctor.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.doctor.doctorNumber) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
            "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
            "(:departmentId IS NULL OR a.department.id = :departmentId) AND " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
            "(:endDate IS NULL OR a.appointmentDate <= :endDate)")
    Page<Appointment> searchAppointments(
            @Param("query") String query,
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("departmentId") Long departmentId,
            @Param("status") AppointmentStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE " +
            "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
            "(:departmentId IS NULL OR a.department.id = :departmentId) AND " +
            "a.appointmentDate BETWEEN :startDate AND :endDate " +
            "ORDER BY a.appointmentDate ASC, a.appointmentTime ASC")
    List<Appointment> findCalendarAppointments(
            @Param("doctorId") Long doctorId,
            @Param("departmentId") Long departmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    long countByStatus(AppointmentStatus status);

    long countByAppointmentDate(LocalDate date);

    long countByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);

    long countByAppointmentDateGreaterThanEqualAndStatusNotIn(LocalDate date, Collection<AppointmentStatus> statuses);

    long countByPatientId(Long patientId);

    long countByDoctorId(Long doctorId);
}
