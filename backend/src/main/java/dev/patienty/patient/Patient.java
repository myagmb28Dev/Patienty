package dev.patienty.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "patient")
public class Patient {
    @Id private UUID id;
    @Column(name = "patient_number", nullable = false, unique = true) private String patientNumber;
    @Column(nullable = false) private String name;
    @Column(name = "birth_date", nullable = false) private LocalDate birthDate;
    @Column(name = "sex_code", nullable = false) private String sexCode;
    protected Patient() {}
    public UUID getId() { return id; }
    public String getPatientNumber() { return patientNumber; }
    public String getName() { return name; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getSexCode() { return sexCode; }
}
