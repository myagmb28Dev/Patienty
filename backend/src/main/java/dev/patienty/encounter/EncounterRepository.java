package dev.patienty.encounter;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EncounterRepository extends JpaRepository<Encounter, UUID> {
    Optional<Encounter> findFirstByPatientIdAndStatusOrderByOccurredAtDesc(UUID patientId, String status);
    List<Encounter> findTop20ByPatientIdAndStatusOrderByOccurredAtDesc(UUID patientId, String status);
    List<Encounter> findByPatientIdAndStatusAndOccurredAtAfterOrderByOccurredAtDesc(UUID patientId, String status, Instant after);
}
