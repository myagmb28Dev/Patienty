package dev.patienty.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class AuthControllerUnitTest {
    private AuthenticationManager authenticationManager;
    private CurrentClinicianService currentClinicianService;
    private ClinicianRepository clinicianRepository;
    private PasswordEncoder passwordEncoder;
    private AuthController controller;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        currentClinicianService = mock(CurrentClinicianService.class);
        clinicianRepository = mock(ClinicianRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        controller = new AuthController(authenticationManager, currentClinicianService, clinicianRepository, passwordEncoder);
    }

    @Test
    void changePassword_success() {
        Clinician clinician = new Clinician();
        clinician.updatePasswordHash("encodedOldPassword");
        when(currentClinicianService.requireCurrent()).thenReturn(clinician);
        when(passwordEncoder.matches("oldPassword123", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword456")).thenReturn("encodedNewPassword");

        controller.changePassword(new AuthController.ChangePasswordRequest("oldPassword123", "newPassword456"));

        assertThat(clinician.getPasswordHash()).isEqualTo("encodedNewPassword");
        verify(clinicianRepository).save(clinician);
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsBadRequest() {
        Clinician clinician = new Clinician();
        clinician.updatePasswordHash("encodedOldPassword");
        when(currentClinicianService.requireCurrent()).thenReturn(clinician);
        when(passwordEncoder.matches("wrongPassword", "encodedOldPassword")).thenReturn(false);

        assertThatThrownBy(() -> controller.changePassword(new AuthController.ChangePasswordRequest("wrongPassword", "newPassword456")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("현재 비밀번호가 일치하지 않습니다.");

        verify(clinicianRepository, never()).save(any());
    }

    @Test
    void changePassword_samePassword_throwsBadRequest() {
        Clinician clinician = new Clinician();
        clinician.updatePasswordHash("encodedOldPassword");
        when(currentClinicianService.requireCurrent()).thenReturn(clinician);
        when(passwordEncoder.matches("samePassword123", "encodedOldPassword")).thenReturn(true);

        assertThatThrownBy(() -> controller.changePassword(new AuthController.ChangePasswordRequest("samePassword123", "samePassword123")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("새 비밀번호는 현재 비밀번호와 달라야 합니다.");

        verify(clinicianRepository, never()).save(any());
    }
}