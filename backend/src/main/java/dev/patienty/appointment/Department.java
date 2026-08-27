package dev.patienty.appointment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "department")
public class Department {
    @Id private String code;
    @Column(name = "display_name", nullable = false) private String displayName;
    protected Department() {}
    public String getCode() { return code; }
    public String getDisplayName() { return displayName; }
}
