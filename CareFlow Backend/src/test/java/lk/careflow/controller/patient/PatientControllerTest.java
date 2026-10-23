package lk.careflow.controller.patient;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import lk.careflow.dto.patient.CreatePatientRequest;
import lk.careflow.dto.patient.PatientResponse;
import lk.careflow.dto.patient.PatientStatsResponse;
import lk.careflow.dto.patient.UpdatePatientRequest;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.service.patient.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PatientControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private PatientService patientService;

    @InjectMocks
    private PatientController patientController;

    private PatientResponse samplePatientResponse;

    @BeforeEach
    void setUp() {
        objectMapper = Jackson2ObjectMapperBuilder.json().build();
        objectMapper.findAndRegisterModules();

        mockMvc = MockMvcBuilders.standaloneSetup(patientController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        samplePatientResponse = PatientResponse.builder()
                .id(1L)
                .patientNumber("PAT-10001")
                .firstName("John")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1985, 5, 15))
                .gender(Gender.MALE)
                .bloodGroup("O+")
                .contactNumber("+94711234567")
                .email("johndoe@example.com")
                .status(PatientStatus.ACTIVE)
                .build();
    }

    @Test
    void testSearchPatients() throws Exception {
        when(patientService.searchPatients(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(samplePatientResponse), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/patients")
                        .param("query", "John")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].patientNumber").value("PAT-10001"))
                .andExpect(jsonPath("$.content[0].firstName").value("John"));
    }

    @Test
    void testGetPatientById() throws Exception {
        when(patientService.getPatientById(1L)).thenReturn(samplePatientResponse);

        mockMvc.perform(get("/api/patients/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.patientNumber").value("PAT-10001"));
    }

    @Test
    void testGetPatientByNumber() throws Exception {
        when(patientService.getPatientByNumber("PAT-10001")).thenReturn(samplePatientResponse);

        mockMvc.perform(get("/api/patients/number/PAT-10001")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientNumber").value("PAT-10001"));
    }

    @Test
    void testCreatePatient() throws Exception {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1985, 5, 15))
                .gender(Gender.MALE)
                .bloodGroup("O+")
                .contactNumber("+94711234567")
                .build();

        when(patientService.createPatient(any(CreatePatientRequest.class), any(), any()))
                .thenReturn(samplePatientResponse);

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientNumber").value("PAT-10001"));
    }

    @Test
    void testUpdatePatient() throws Exception {
        UpdatePatientRequest request = UpdatePatientRequest.builder()
                .firstName("John Updated")
                .lastName("Doe")
                .dateOfBirth(LocalDate.of(1985, 5, 15))
                .gender(Gender.MALE)
                .contactNumber("+94711234567")
                .build();

        when(patientService.updatePatient(eq(1L), any(UpdatePatientRequest.class), any(), any()))
                .thenReturn(samplePatientResponse);

        mockMvc.perform(put("/api/patients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientNumber").value("PAT-10001"));
    }

    @Test
    void testUpdatePatientStatus() throws Exception {
        doNothing().when(patientService).updatePatientStatus(eq(1L), eq(PatientStatus.INACTIVE), any(), any());

        mockMvc.perform(patch("/api/patients/1/status")
                        .param("status", "INACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Patient status updated to INACTIVE"));
    }

    @Test
    void testDeletePatient() throws Exception {
        doNothing().when(patientService).deletePatient(eq(1L), any(), any());

        mockMvc.perform(delete("/api/patients/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Patient deleted successfully"));
    }

    @Test
    void testGetPatientStats() throws Exception {
        PatientStatsResponse stats = PatientStatsResponse.builder()
                .totalPatients(50)
                .activePatients(45)
                .inactivePatients(4)
                .deceasedPatients(1)
                .newPatientsToday(3)
                .build();

        when(patientService.getPatientStats()).thenReturn(stats);

        mockMvc.perform(get("/api/patients/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPatients").value(50))
                .andExpect(jsonPath("$.activePatients").value(45));
    }
}
