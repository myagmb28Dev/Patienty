package dev.patienty.prescription;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "prescription")
public class Prescription {
    @Id private UUID id;
    @Column(name = "patient_id", nullable = false) private UUID patientId;
    @Column(name = "encounter_id") private UUID encounterId;
    @Column(name = "prescribed_at", nullable = false) private Instant prescribedAt;
    @Column(nullable = false) private String status;
    protected Prescription() {}
    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public UUID getEncounterId() { return encounterId; }
    public Instant getPrescribedAt() { return prescribedAt; }
    public String getStatus() { return status; }
}
