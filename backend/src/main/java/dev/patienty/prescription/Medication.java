package dev.patienty.prescription;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "medication")
public class Medication {
    @Id private UUID id;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String name;
    @Column(name = "default_unit") private String defaultUnit;
    protected Medication() {}
    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDefaultUnit() { return defaultUnit; }
}
