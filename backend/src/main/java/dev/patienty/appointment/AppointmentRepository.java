package dev.patienty.appointment;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    Optional<Appointment> findFirstByPatientIdAndScheduledStartAfterAndStatusInOrderByScheduledStartAsc(UUID patientId, Instant now, Collection<String> statuses);
    List<Appointment> findByPatientIdAndScheduledStartBetweenAndStatusInOrderByScheduledStartAsc(UUID patientId, Instant start, Instant end, Collection<String> statuses);
}
