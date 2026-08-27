package dev.patienty.patient;

import dev.patienty.patient.PatientDtos.DashboardAppointment;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardReadRepository {
    private final JdbcClient jdbc;

    public DashboardReadRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<DashboardAppointment> findTodayAppointments(
            UUID clinicianId, Instant start, Instant end) {
        return jdbc.sql("""
                        SELECT ap.id AS appointment_id,
                               p.id AS patient_id,
                               p.patient_number,
                               p.name AS patient_name,
                               ap.department_code,
                               d.display_name AS department_name,
                               ap.scheduled_start,
                               ap.status,
                               ap.reason
                        FROM appointment ap
                        JOIN clinician_patient_assignment assignment
                          ON assignment.patient_id = ap.patient_id
                         AND assignment.clinician_id = :clinicianId
                        JOIN patient p ON p.id = ap.patient_id
                        JOIN department d ON d.code = ap.department_code
                        WHERE ap.scheduled_start >= :start
                          AND ap.scheduled_start < :end
                          AND ap.status IN ('SCHEDULED', 'CHECKED_IN')
                        ORDER BY ap.scheduled_start, ap.id
                        """)
                .param("clinicianId", clinicianId)
                .param("start", Timestamp.from(start))
                .param("end", Timestamp.from(end))
                .query(DashboardReadRepository::appointment)
                .list();
    }

    public List<ReviewPatient> findPatientsNeedingReview(
            UUID clinicianId, Instant after, Instant now) {
        return jdbc.sql("""
                        WITH measurement_series AS (
                            SELECT examination.patient_id,
                                   result.metric_code,
                                   COALESCE(result.unit, '') AS unit,
                                   count(*) AS point_count,
                                   (array_agg(result.numeric_value ORDER BY examination.performed_at, examination.id, result.id))[1] AS first_value,
                                   (array_agg(result.numeric_value ORDER BY examination.performed_at DESC, examination.id DESC, result.id DESC))[1] AS last_value,
                                   (array_agg(result.abnormal_flag ORDER BY examination.performed_at DESC, examination.id DESC, result.id DESC))[1] AS latest_flag,
                                   bool_or(result.abnormal_flag <> 'NORMAL') AS any_abnormal
                            FROM examination_result result
                            JOIN examination ON examination.id = result.examination_id
                            JOIN clinician_patient_assignment assignment
                              ON assignment.patient_id = examination.patient_id
                             AND assignment.clinician_id = :clinicianId
                            WHERE examination.status = 'FINAL'
                              AND examination.performed_at >= :after
                              AND examination.performed_at <= :now
                              AND result.numeric_value IS NOT NULL
                            GROUP BY examination.patient_id, result.metric_code, COALESCE(result.unit, '')
                        ),
                        measurement_attention AS (
                            SELECT patient_id,
                                   sum(
                                       CASE
                                           WHEN point_count >= 2 AND abs(last_value - first_value) >= 0.01
                                               THEN CASE WHEN latest_flag <> 'NORMAL' THEN 1 ELSE 0 END
                                           WHEN any_abnormal THEN 1
                                           ELSE 0
                                       END
                                   )::integer AS attention_count
                            FROM measurement_series
                            GROUP BY patient_id
                        ),
                        prescription_fingerprint AS (
                            SELECT prescription.patient_id,
                                   prescription.id AS prescription_id,
                                   prescription.prescribed_at,
                                   jsonb_object_agg(
                                       medication.code,
                                       jsonb_build_array(
                                           item.dose_value,
                                           item.dose_unit,
                                           item.frequency_per_day
                                       )
                                   ) AS fingerprint
                            FROM prescription_item item
                            JOIN prescription ON prescription.id = item.prescription_id
                            JOIN medication ON medication.id = item.medication_id
                            JOIN clinician_patient_assignment assignment
                              ON assignment.patient_id = prescription.patient_id
                             AND assignment.clinician_id = :clinicianId
                            WHERE prescription.prescribed_at >= :after
                            GROUP BY prescription.patient_id, prescription.id, prescription.prescribed_at
                        ),
                        ranked_prescriptions AS (
                            SELECT fingerprint.*,
                                   row_number() OVER (
                                       PARTITION BY patient_id
                                       ORDER BY prescribed_at DESC, prescription_id DESC
                                   ) AS position
                            FROM prescription_fingerprint fingerprint
                        ),
                        prescription_pairs AS (
                            SELECT latest.patient_id,
                                   latest.fingerprint AS latest,
                                   previous.fingerprint AS previous
                            FROM ranked_prescriptions latest
                            JOIN ranked_prescriptions previous
                              ON previous.patient_id = latest.patient_id
                             AND previous.position = 2
                            WHERE latest.position = 1
                        ),
                        prescription_attention AS (
                            SELECT patient_id,
                                   CASE WHEN latest IS DISTINCT FROM previous THEN 1 ELSE 0 END AS attention_count
                            FROM prescription_pairs
                        ),
                        attention_totals AS (
                            SELECT patient_id, sum(attention_count)::integer AS attention_count
                            FROM (
                                SELECT patient_id, attention_count FROM measurement_attention
                                UNION ALL
                                SELECT patient_id, attention_count FROM prescription_attention
                            ) attention
                            GROUP BY patient_id
                        )
                        SELECT patient.id,
                               patient.patient_number,
                               patient.name,
                               patient.birth_date,
                               patient.sex_code,
                               COALESCE(last_encounter.department_code, next_appointment.department_code) AS department_code,
                               department.display_name AS department_name,
                               last_encounter.occurred_at AS last_encounter_at,
                               next_appointment.scheduled_start AS next_appointment_at,
                               totals.attention_count
                        FROM attention_totals totals
                        JOIN clinician_patient_assignment assignment
                          ON assignment.patient_id = totals.patient_id
                         AND assignment.clinician_id = :clinicianId
                        JOIN patient ON patient.id = totals.patient_id
                        LEFT JOIN LATERAL (
                            SELECT encounter.department_code, encounter.occurred_at
                            FROM encounter
                            WHERE encounter.patient_id = patient.id
                              AND encounter.status = 'COMPLETED'
                            ORDER BY encounter.occurred_at DESC
                            LIMIT 1
                        ) last_encounter ON true
                        LEFT JOIN LATERAL (
                            SELECT appointment.department_code, appointment.scheduled_start
                            FROM appointment
                            WHERE appointment.patient_id = patient.id
                              AND appointment.scheduled_start > :now
                              AND appointment.status IN ('SCHEDULED', 'CHECKED_IN')
                            ORDER BY appointment.scheduled_start
                            LIMIT 1
                        ) next_appointment ON true
                        LEFT JOIN department
                          ON department.code = COALESCE(last_encounter.department_code, next_appointment.department_code)
                        WHERE totals.attention_count > 0
                        ORDER BY totals.attention_count DESC, patient.patient_number
                        LIMIT 10
                        """)
                .param("clinicianId", clinicianId)
                .param("after", Timestamp.from(after))
                .param("now", Timestamp.from(now))
                .query(DashboardReadRepository::reviewPatient)
                .list();
    }

    private static DashboardAppointment appointment(ResultSet result, int rowNumber)
            throws SQLException {
        return new DashboardAppointment(
                result.getObject("appointment_id", UUID.class),
                result.getObject("patient_id", UUID.class),
                result.getString("patient_number"),
                result.getString("patient_name"),
                result.getString("department_code"),
                result.getString("department_name"),
                instant(result, "scheduled_start"),
                result.getString("status"),
                result.getString("reason"));
    }

    private static ReviewPatient reviewPatient(ResultSet result, int rowNumber)
            throws SQLException {
        return new ReviewPatient(
                result.getObject("id", UUID.class),
                result.getString("patient_number"),
                result.getString("name"),
                result.getObject("birth_date", LocalDate.class),
                result.getString("sex_code"),
                result.getString("department_code"),
                result.getString("department_name"),
                instant(result, "last_encounter_at"),
                instant(result, "next_appointment_at"),
                result.getInt("attention_count"));
    }

    private static Instant instant(ResultSet result, String column) throws SQLException {
        Timestamp value = result.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    public record ReviewPatient(
            UUID id,
            String patientNumber,
            String name,
            LocalDate birthDate,
            String sexCode,
            String departmentCode,
            String departmentName,
            Instant lastEncounterAt,
            Instant nextAppointmentAt,
            int attentionCount) {}
}
