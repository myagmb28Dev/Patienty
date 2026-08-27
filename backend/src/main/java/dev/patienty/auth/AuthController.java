package dev.patienty.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final CurrentClinicianService currentClinicianService;
    public AuthController(AuthenticationManager authenticationManager, CurrentClinicianService currentClinicianService) {
        this.authenticationManager = authenticationManager;
        this.currentClinicianService = currentClinicianService;
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
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record ClinicianResponse(java.util.UUID id, String name, String email, String role) {
        static ClinicianResponse from(Clinician c) { return new ClinicianResponse(c.getId(), c.getName(), c.getEmail(), c.getRole()); }
    }
    public record CsrfResponse(String token, String headerName) {}
}
