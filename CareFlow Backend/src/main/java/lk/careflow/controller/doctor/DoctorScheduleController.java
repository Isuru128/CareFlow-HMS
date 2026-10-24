package lk.careflow.controller.doctor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.careflow.dto.doctor.AvailableSlotResponse;
import lk.careflow.dto.doctor.DoctorScheduleRequest;
import lk.careflow.dto.doctor.DoctorScheduleResponse;
import lk.careflow.dto.user.MessageResponse;
import lk.careflow.entity.user.User;
import lk.careflow.service.doctor.DoctorScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/doctors/{doctorId}/schedules")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<List<DoctorScheduleResponse>> getDoctorSchedules(@PathVariable Long doctorId) {
        return ResponseEntity.ok(scheduleService.getSchedulesByDoctorId(doctorId));
    }

    @GetMapping("/available-slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LABORATORY_STAFF', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<AvailableSlotResponse> getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.getAvailableSlots(doctorId, date));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorScheduleResponse> createSchedule(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorScheduleRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        DoctorScheduleResponse response = scheduleService.createSchedule(doctorId, request, currentUser, httpRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorScheduleResponse> updateSchedule(
            @PathVariable Long doctorId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody DoctorScheduleRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(scheduleService.updateSchedule(doctorId, scheduleId, request, currentUser, httpRequest));
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MessageResponse> deleteSchedule(
            @PathVariable Long doctorId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        scheduleService.deleteSchedule(doctorId, scheduleId, currentUser, httpRequest);
        return ResponseEntity.ok(new MessageResponse("Schedule deleted successfully"));
    }
}
