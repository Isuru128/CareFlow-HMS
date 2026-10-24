package lk.careflow.service.doctor;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.doctor.AvailableSlotResponse;
import lk.careflow.dto.doctor.DoctorScheduleRequest;
import lk.careflow.dto.doctor.DoctorScheduleResponse;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.doctor.DoctorSchedule;
import lk.careflow.entity.doctor.DoctorStatus;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.doctor.DoctorScheduleRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedulesByDoctorId(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor", "id", doctorId);
        }
        return scheduleRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorScheduleResponse createSchedule(Long doctorId, DoctorScheduleRequest request, User currentUser, HttpServletRequest httpRequest) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (scheduleRepository.existsOverlappingSchedule(
                doctorId,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                null)) {
            throw new BadRequestException("Schedule overlaps with an existing schedule for Dr. " + doctor.getFirstName() + " on " + request.getDayOfWeek());
        }

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxPatients(request.getMaxPatients())
                .slotDurationMinutes(request.getSlotDurationMinutes())
                .roomNumber(request.getRoomNumber() != null ? request.getRoomNumber().trim() : doctor.getRoomNumber())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        DoctorSchedule saved = scheduleRepository.save(schedule);

        auditLogService.log(
                currentUser,
                "CREATE_DOCTOR_SCHEDULE",
                "DoctorSchedule",
                saved.getId().toString(),
                "Created schedule for Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + " on " + saved.getDayOfWeek() + " (" + saved.getStartTime() + " - " + saved.getEndTime() + ")",
                httpRequest
        );

        return mapToScheduleResponse(saved);
    }

    @Transactional
    public DoctorScheduleResponse updateSchedule(Long doctorId, Long scheduleId, DoctorScheduleRequest request, User currentUser, HttpServletRequest httpRequest) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", scheduleId));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("Schedule ID " + scheduleId + " does not belong to Doctor ID " + doctorId);
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (scheduleRepository.existsOverlappingSchedule(
                doctorId,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                scheduleId)) {
            throw new BadRequestException("Updated schedule overlaps with an existing schedule on " + request.getDayOfWeek());
        }

        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setMaxPatients(request.getMaxPatients());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setRoomNumber(request.getRoomNumber() != null ? request.getRoomNumber().trim() : schedule.getDoctor().getRoomNumber());
        if (request.getIsActive() != null) {
            schedule.setActive(request.getIsActive());
        }

        DoctorSchedule updated = scheduleRepository.save(schedule);

        auditLogService.log(
                currentUser,
                "UPDATE_DOCTOR_SCHEDULE",
                "DoctorSchedule",
                updated.getId().toString(),
                "Updated schedule for Dr. " + schedule.getDoctor().getFirstName() + " on " + updated.getDayOfWeek(),
                httpRequest
        );

        return mapToScheduleResponse(updated);
    }

    @Transactional
    public void deleteSchedule(Long doctorId, Long scheduleId, User currentUser, HttpServletRequest httpRequest) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", scheduleId));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("Schedule ID " + scheduleId + " does not belong to Doctor ID " + doctorId);
        }

        scheduleRepository.delete(schedule);

        auditLogService.log(
                currentUser,
                "DELETE_DOCTOR_SCHEDULE",
                "DoctorSchedule",
                scheduleId.toString(),
                "Deleted schedule ID " + scheduleId + " for Dr. " + schedule.getDoctor().getFirstName(),
                httpRequest
        );
    }

    @Transactional(readOnly = true)
    public AvailableSlotResponse getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<DoctorSchedule> schedules = scheduleRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(doctorId, dayOfWeek);

        if (doctor.getStatus() != DoctorStatus.ACTIVE || schedules.isEmpty()) {
            return AvailableSlotResponse.builder()
                    .doctorId(doctorId)
                    .doctorName("Dr. " + doctor.getFirstName() + " " + doctor.getLastName())
                    .date(date)
                    .dayOfWeek(dayOfWeek.name())
                    .isAvailable(false)
                    .totalCapacity(0)
                    .totalBooked(0)
                    .timeSlots(new ArrayList<>())
                    .build();
        }

        int totalCapacity = 0;
        List<AvailableSlotResponse.TimeSlotInfo> timeSlots = new ArrayList<>();

        for (DoctorSchedule schedule : schedules) {
            totalCapacity += schedule.getMaxPatients();
            int slotDuration = schedule.getSlotDurationMinutes() != null && schedule.getSlotDurationMinutes() > 0
                    ? schedule.getSlotDurationMinutes() : 15;

            LocalTime current = schedule.getStartTime();
            int slotsGenerated = 0;
            while (current.isBefore(schedule.getEndTime()) && slotsGenerated < schedule.getMaxPatients()) {
                boolean isBooked = appointmentRepository.existsConflictingAppointment(doctorId, date, current, null);
                timeSlots.add(AvailableSlotResponse.TimeSlotInfo.builder()
                        .time(current)
                        .isAvailable(!isBooked)
                        .build());
                current = current.plusMinutes(slotDuration);
                slotsGenerated++;
            }
        }

        long activeBookedCount = appointmentRepository.countActiveAppointmentsForDoctorOnDate(doctorId, date);

        return AvailableSlotResponse.builder()
                .doctorId(doctorId)
                .doctorName("Dr. " + doctor.getFirstName() + " " + doctor.getLastName())
                .date(date)
                .dayOfWeek(dayOfWeek.name())
                .isAvailable(activeBookedCount < totalCapacity && timeSlots.stream().anyMatch(AvailableSlotResponse.TimeSlotInfo::isAvailable))
                .totalCapacity(totalCapacity)
                .totalBooked((int) activeBookedCount)
                .timeSlots(timeSlots)
                .build();
    }

    private DoctorScheduleResponse mapToScheduleResponse(DoctorSchedule schedule) {
        return DoctorScheduleResponse.builder()
                .id(schedule.getId())
                .doctorId(schedule.getDoctor().getId())
                .doctorName("Dr. " + schedule.getDoctor().getFirstName() + " " + schedule.getDoctor().getLastName())
                .dayOfWeek(schedule.getDayOfWeek())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .maxPatients(schedule.getMaxPatients())
                .slotDurationMinutes(schedule.getSlotDurationMinutes())
                .roomNumber(schedule.getRoomNumber())
                .isActive(schedule.isActive())
                .build();
    }
}
