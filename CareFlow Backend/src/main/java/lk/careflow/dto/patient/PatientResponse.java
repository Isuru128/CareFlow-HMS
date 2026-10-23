package lk.careflow.dto.patient;

import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {

    private Long id;
    private String patientNumber;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodGroup;
    private String contactNumber;
    private String email;
    private String nicOrPassport;
    private String address;
    private String emergencyContactName;
    private String emergencyContactNumber;
    private String emergencyContactRelation;
    private String allergies;
    private PatientStatus status;
    private Long registeredById;
    private String registeredByName;
    private long totalMedicalHistories;
    private long totalDocuments;
    private Instant createdAt;
    private Instant updatedAt;
}
