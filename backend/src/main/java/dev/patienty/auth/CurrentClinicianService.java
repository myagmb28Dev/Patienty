package dev.patienty.auth;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentClinicianService {
    private final ClinicianRepository clinicianRepository;
    public CurrentClinicianService(ClinicianRepository clinicianRepository) { this.clinicianRepository = clinicianRepository; }

    public Clinician requireCurrent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        return clinicianRepository.findByEmailIgnoreCase(authentication.getName())
                .filter(Clinician::isEnabled)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Authentication is required"));
    }
}
