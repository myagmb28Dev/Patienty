package dev.patienty.patient;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    @Query(value = """
            SELECT p.* FROM patient p
            JOIN clinician_patient_assignment a ON a.patient_id = p.id
            WHERE a.clinician_id = :clinicianId
              AND (:query = '' OR lower(p.name) LIKE lower(concat('%', :query, '%')) OR lower(p.patient_number) LIKE lower(concat('%', :query, '%')))
              AND (:department = '' OR EXISTS (SELECT 1 FROM encounter e WHERE e.patient_id=p.id AND e.department_code=:department AND e.status='COMPLETED'))
              AND (:appointmentStatus = '' OR EXISTS (SELECT 1 FROM appointment ap WHERE ap.patient_id=p.id AND ap.status=:appointmentStatus))
            ORDER BY (SELECT max(e.occurred_at) FROM encounter e WHERE e.patient_id=p.id AND e.status='COMPLETED') DESC NULLS LAST, p.patient_number
            """, countQuery = """
            SELECT count(*) FROM patient p JOIN clinician_patient_assignment a ON a.patient_id=p.id
            WHERE a.clinician_id=:clinicianId
              AND (:query = '' OR lower(p.name) LIKE lower(concat('%', :query, '%')) OR lower(p.patient_number) LIKE lower(concat('%', :query, '%')))
              AND (:department = '' OR EXISTS (SELECT 1 FROM encounter e WHERE e.patient_id=p.id AND e.department_code=:department AND e.status='COMPLETED'))
              AND (:appointmentStatus = '' OR EXISTS (SELECT 1 FROM appointment ap WHERE ap.patient_id=p.id AND ap.status=:appointmentStatus))
            """, nativeQuery = true)
    Page<Patient> searchAssigned(@Param("clinicianId") UUID clinicianId, @Param("query") String query,
            @Param("department") String department, @Param("appointmentStatus") String appointmentStatus, Pageable pageable);

    @Query(value = "SELECT p.* FROM patient p JOIN clinician_patient_assignment a ON a.patient_id=p.id WHERE a.clinician_id=:clinicianId AND p.id=:patientId", nativeQuery = true)
    Optional<Patient> findAssignedById(@Param("clinicianId") UUID clinicianId, @Param("patientId") UUID patientId);

    @Query(value = """
            SELECT p.* FROM patient p
            JOIN clinician_patient_assignment a ON a.patient_id = p.id
            WHERE a.clinician_id = :clinicianId
              AND (
                (:patientId IS NOT NULL AND p.id = :patientId)
                OR lower(p.patient_number) = lower(:identifier)
              )
            """, nativeQuery = true)
    Optional<Patient> findAssignedByIdOrNumber(
            @Param("clinicianId") UUID clinicianId,
            @Param("patientId") UUID patientId,
            @Param("identifier") String identifier);
}
