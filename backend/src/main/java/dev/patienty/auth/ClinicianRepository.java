package dev.patienty.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicianRepository extends JpaRepository<Clinician, UUID> {
    Optional<Clinician> findByEmailIgnoreCase(String email);
}
