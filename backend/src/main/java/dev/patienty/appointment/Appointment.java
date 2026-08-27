package dev.patienty.appointment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "appointment")
public class Appointment {
    @Id private UUID id;
    @Column(name = "patient_id", nullable = false) private UUID patientId;
    @Column(name = "department_code", nullable = false) private String departmentCode;
    @Column(name = "scheduled_start", nullable = false) private Instant scheduledStart;
    @Column(name = "scheduled_end", nullable = false) private Instant scheduledEnd;
    @Column(nullable = false) private String status;
    private String reason;
    protected Appointment() {}
    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getDepartmentCode() { return departmentCode; }
    public Instant getScheduledStart() { return scheduledStart; }
    public Instant getScheduledEnd() { return scheduledEnd; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
}
