package dev.patienty.prescription;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
public record PrescriptionRecord(UUID prescriptionId, Instant prescribedAt, String status, UUID itemId, UUID medicationId, String medicationCode, String medicationName, BigDecimal doseValue, String doseUnit, BigDecimal frequencyPerDay, String route, LocalDate startDate, LocalDate endDate, String instructions) {
    public String evidenceId() { return "prescription:" + prescriptionId; }
}
