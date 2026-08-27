package dev.patienty.prescription;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prescription_item")
public class PrescriptionItem {
    @Id private UUID id;
    @Column(name = "prescription_id", nullable = false) private UUID prescriptionId;
    @Column(name = "medication_id", nullable = false) private UUID medicationId;
    @Column(name = "dose_value", nullable = false) private BigDecimal doseValue;
    @Column(name = "dose_unit", nullable = false) private String doseUnit;
    @Column(name = "frequency_per_day", nullable = false) private BigDecimal frequencyPerDay;
    private String route;
    @Column(name = "start_date", nullable = false) private LocalDate startDate;
    @Column(name = "end_date") private LocalDate endDate;
    private String instructions;
    protected PrescriptionItem() {}
    public UUID getId() { return id; }
    public UUID getPrescriptionId() { return prescriptionId; }
    public UUID getMedicationId() { return medicationId; }
    public BigDecimal getDoseValue() { return doseValue; }
    public String getDoseUnit() { return doseUnit; }
    public BigDecimal getFrequencyPerDay() { return frequencyPerDay; }
    public String getRoute() { return route; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getInstructions() { return instructions; }
}
