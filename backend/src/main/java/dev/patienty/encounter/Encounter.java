package dev.patienty.encounter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "encounter")
public class Encounter {
    @Id private UUID id;
    @Column(name = "patient_id", nullable = false) private UUID patientId;
    @Column(name = "department_code", nullable = false) private String departmentCode;
    @Column(name = "occurred_at", nullable = false) private Instant occurredAt;
    @Column(name = "chief_complaint") private String chiefComplaint;
    private String note;
    @Column(nullable = false) private String status;
    protected Encounter() {}
    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getDepartmentCode() { return departmentCode; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
}
