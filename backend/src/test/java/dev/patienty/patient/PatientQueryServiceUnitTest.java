package dev.patienty.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.patienty.appointment.*;
import dev.patienty.auth.*;
import dev.patienty.encounter.*;
import dev.patienty.examination.*;
import dev.patienty.insight.InsightService;
import dev.patienty.prescription.*;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

class PatientQueryServiceUnitTest {
    private PatientRepository patients;
    private AppointmentRepository appointments;
    private DepartmentRepository departments;
    private EncounterRepository encounters;
    private ExaminationResultRepository examinations;
    private PrescriptionItemRepository prescriptions;
    private CurrentClinicianService current;
    private InsightService insights;
    private DashboardReadRepository dashboard;
    private PatientQueryService service;

    private Clinician clinician;
    private UUID clinicianId;

    @BeforeEach
    void setUp() {
        patients = mock(PatientRepository.class);
        appointments = mock(AppointmentRepository.class);
        departments = mock(DepartmentRepository.class);
        encounters = mock(EncounterRepository.class);
        examinations = mock(ExaminationResultRepository.class);
        prescriptions = mock(PrescriptionItemRepository.class);
        current = mock(CurrentClinicianService.class);
        insights = mock(InsightService.class);
        dashboard = mock(DashboardReadRepository.class);

        clinicianId = UUID.randomUUID();
        clinician = mock(Clinician.class);
        when(clinician.getId()).thenReturn(clinicianId);
        when(current.requireCurrent()).thenReturn(clinician);

        service = new PatientQueryService(
                patients, appointments, departments, encounters, examinations, prescriptions, current, insights, dashboard);
    }

    @Test
    void search_escapesLikeWildcards() {
        when(patients.searchAssigned(eq(clinicianId), eq("100\\%\\_test\\\\"), anyString(), anyString(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search("100%_test\\", "", "", 0, 10);

        verify(patients).searchAssigned(eq(clinicianId), eq("100\\%\\_test\\\\"), anyString(), anyString(), any(PageRequest.class));
    }

    @Test
    void search_normalQuery_passesCleanString() {
        when(patients.searchAssigned(eq(clinicianId), eq("김민준"), anyString(), anyString(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search("  김민준  ", "", "", 0, 10);

        verify(patients).searchAssigned(eq(clinicianId), eq("김민준"), anyString(), anyString(), any(PageRequest.class));
    }
}