package dev.patienty.shared;

import java.time.Instant;
import java.util.List;
import org.springframework.http.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound(ResourceNotFoundException e) { return response(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", e.getMessage(), List.of()); }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> unauthenticated(AuthenticationException e) { return response(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", List.of()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {
        List<FieldViolation> violations = e.getBindingResult().getFieldErrors().stream().map(error -> new FieldViolation(error.getField(), message(error))).toList();
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "요청 값을 확인해 주세요.", violations);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> badRequest(IllegalArgumentException e) { return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", e.getMessage(), List.of()); }
    private static String message(FieldError e) { return e.getDefaultMessage() == null ? "유효하지 않은 값입니다." : e.getDefaultMessage(); }
    private static ResponseEntity<ApiError> response(HttpStatus status, String code, String message, List<FieldViolation> violations) { return ResponseEntity.status(status).body(new ApiError(code, message, violations, Instant.now())); }
    public record ApiError(String code, String message, List<FieldViolation> violations, Instant timestamp) {}
    public record FieldViolation(String field, String message) {}
}
