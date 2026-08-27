package dev.patienty.examination;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "examination")
public class Examination {
    @Id private UUID id;
    @Column(name = "patient_id", nullable = false) private UUID patientId;
    @Column(name = "encounter_id") private UUID encounterId;
    @Column(name = "performed_at", nullable = false) private Instant performedAt;
    @Column(nullable = false) private String type;
    @Column(nullable = false) private String status;
    protected Examination() {}
    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public UUID getEncounterId() { return encounterId; }
    public Instant getPerformedAt() { return performedAt; }
    public String getType() { return type; }
    public String getStatus() { return status; }
}
