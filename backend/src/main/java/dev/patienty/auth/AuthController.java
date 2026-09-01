package dev.patienty.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final CurrentClinicianService currentClinicianService;
    private final ClinicianRepository clinicianRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            CurrentClinicianService currentClinicianService,
            ClinicianRepository clinicianRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.currentClinicianService = currentClinicianService;
        this.clinicianRepository = clinicianRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        return new CsrfResponse(token.getToken(), token.getHeaderName());
    }

    @PostMapping("/login")
    public ClinicianResponse login(@Valid @RequestBody LoginRequest input, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(input.email().trim().toLowerCase(), input.password()));
        if (request.getSession(false) != null) request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
        return ClinicianResponse.from(currentClinicianService.requireCurrent());
    }

    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    @GetMapping("/me") public ClinicianResponse me() { return ClinicianResponse.from(currentClinicianService.requireCurrent()); }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest input) {
        Clinician current = currentClinicianService.requireCurrent();
        if (!passwordEncoder.matches(input.currentPassword(), current.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다.");
        }
        if (input.currentPassword().equals(input.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }
        current.updatePasswordHash(passwordEncoder.encode(input.newPassword()));
        clinicianRepository.save(current);
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record ChangePasswordRequest(
            @NotBlank(message = "현재 비밀번호를 입력해 주세요.") String currentPassword,
            @NotBlank(message = "새 비밀번호를 입력해 주세요.") @Size(min = 6, max = 100, message = "새 비밀번호는 6자 이상 100자 이하여야 합니다.") String newPassword
    ) {}
    public record ClinicianResponse(java.util.UUID id, String name, String email, String role) {
        static ClinicianResponse from(Clinician c) { return new ClinicianResponse(c.getId(), c.getName(), c.getEmail(), c.getRole()); }
    }
    public record CsrfResponse(String token, String headerName) {}
}

