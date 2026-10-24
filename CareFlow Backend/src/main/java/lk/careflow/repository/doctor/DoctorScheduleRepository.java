package lk.careflow.repository.doctor;

import lk.careflow.entity.doctor.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctorId(Long doctorId);

    List<DoctorSchedule> findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long doctorId);

    List<DoctorSchedule> findByDoctorIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(Long doctorId, DayOfWeek dayOfWeek);

    @Query("SELECT COUNT(s) > 0 FROM DoctorSchedule s WHERE s.doctor.id = :doctorId " +
            "AND s.dayOfWeek = :dayOfWeek " +
            "AND s.isActive = true " +
            "AND (:excludeId IS NULL OR s.id <> :excludeId) " +
            "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
    boolean existsOverlappingSchedule(
            @Param("doctorId") Long doctorId,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}
