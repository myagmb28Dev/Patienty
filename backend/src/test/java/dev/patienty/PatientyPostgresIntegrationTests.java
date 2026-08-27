package dev.patienty;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import dev.patienty.assistant.PatientAssistantService;
import dev.patienty.auth.*;
import dev.patienty.patient.PatientQueryService;
import dev.patienty.shared.ResourceNotFoundException;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;

@SpringBootTest @ActiveProfiles("demo") @Testcontainers
class PatientyPostgresIntegrationTests {
    @Container @ServiceConnection static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @Autowired ClinicianRepository clinicians; @Autowired PatientQueryService patients;
    @Autowired PatientAssistantService assistant; @Autowired PasswordEncoder passwordEncoder; @Autowired JdbcTemplate jdbc;
    @AfterEach void clearSecurity(){SecurityContextHolder.clearContext();}

    @Test void flywayLoadsSyntheticCliniciansAndAssignments(){Clinician kim=clinicians.findByEmailIgnoreCase("doctor.kim@patienty.local").orElseThrow();authenticate(kim);var page=patients.search("","","",0,20);assertThat(page.totalElements()).isEqualTo(8);assertThat(page.content()).extracting(row->row.patientNumber()).contains("PAT-000001","PAT-000008");assertThat(passwordEncoder.matches("PatientyDemo1!",kim.getPasswordHash())).isTrue();}
    @Test void filtersAssignedPatientsByAppointmentStatus(){Clinician kim=clinicians.findByEmailIgnoreCase("doctor.kim@patienty.local").orElseThrow();authenticate(kim);var page=patients.search("","","SCHEDULED",0,20);assertThat(page.content()).extracting(row->row.patientNumber()).containsExactlyInAnyOrder("PAT-000001","PAT-000003","PAT-000005");}
    @Test void unassignedPatientIsHiddenAcrossClinicalAndAiApis(){Clinician kim=clinicians.findByEmailIgnoreCase("doctor.kim@patienty.local").orElseThrow();authenticate(kim);UUID id=UUID.fromString("10000000-0000-0000-0000-000000000012");assertThatThrownBy(()->patients.detail(id)).isInstanceOf(ResourceNotFoundException.class);assertThatThrownBy(()->patients.timeline(id)).isInstanceOf(ResourceNotFoundException.class);assertThatThrownBy(()->patients.measurements(id,"",null,null)).isInstanceOf(ResourceNotFoundException.class);assertThatThrownBy(()->assistant.answer(id,"진단해줘")).isInstanceOf(ResourceNotFoundException.class);}
    @Test void assistantReturnsOnlyValidatedEvidence(){Clinician kim=clinicians.findByEmailIgnoreCase("doctor.kim@patienty.local").orElseThrow();authenticate(kim);var response=assistant.answer(UUID.fromString("10000000-0000-0000-0000-000000000001"),"최근 6개월 혈압 추이 알려줘");assertThat(response.status()).isEqualTo("ANSWERED");assertThat(response.observations()).isNotEmpty();var ids=response.evidence().stream().map(e->e.id()).collect(java.util.stream.Collectors.toSet());assertThat(response.observations()).allSatisfy(o->{assertThat(o.evidenceIds()).isNotEmpty();assertThat(ids).containsAll(o.evidenceIds());});}

    @Test
    void rejectsDuplicateMedicationLinesWithinOnePrescription(){
        assertThatThrownBy(()->jdbc.update("""
                INSERT INTO prescription_item(
                    id,prescription_id,medication_id,dose_value,dose_unit,
                    frequency_per_day,route,start_date,instructions
                ) VALUES (?,?,?,?,?,?,?,?,?)
                """,UUID.fromString("80000000-0000-0000-0000-000000000099"),
                UUID.fromString("70000000-0000-0000-0000-000000000002"),
                UUID.fromString("60000000-0000-0000-0000-000000000002"),
                50,"mg",1,"ORAL",LocalDate.now(),"중복 검증"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test @Transactional
    void dashboardIncludesAppointmentsAfterMoreThanOneHundredAssignments(){
        Clinician kim=clinicians.findByEmailIgnoreCase("doctor.kim@patienty.local").orElseThrow();authenticate(kim);
        jdbc.update("""
                INSERT INTO patient(id,patient_number,name,birth_date,sex_code)
                SELECT ('a0000000-0000-0000-0000-'||lpad(series::text,12,'0'))::uuid,
                       'LOAD-'||lpad(series::text,4,'0'),'부하 환자 '||series,date '1980-01-01','UNKNOWN'
                FROM generate_series(1,101) series
                """);
        jdbc.update("""
                INSERT INTO clinician_patient_assignment(clinician_id,patient_id)
                SELECT ?,id FROM patient WHERE patient_number LIKE 'LOAD-%'
                """,kim.getId());
        ZoneId clinic=ZoneId.of("Asia/Seoul");
        Instant scheduled=LocalDate.now(clinic).atTime(13,0).atZone(clinic).toInstant();
        jdbc.update("""
                INSERT INTO appointment(id,patient_id,department_code,scheduled_start,scheduled_end,status,reason)
                VALUES (?,?,?,?,?,'SCHEDULED','100명 이후 담당 환자 검증')
                """,UUID.fromString("b0000000-0000-0000-0000-000000000101"),
                UUID.fromString("a0000000-0000-0000-0000-000000000101"),
                "INTERNAL_MEDICINE",Timestamp.from(scheduled),Timestamp.from(scheduled.plusSeconds(1800)));
        assertThat(patients.dashboard().todayAppointments()).anySatisfy(
                appointment->assertThat(appointment.patientNumber()).isEqualTo("LOAD-0101"));
    }
    private static void authenticate(Clinician c){SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(c.getEmail(),"",List.of(new SimpleGrantedAuthority("ROLE_"+c.getRole()))));}
}
