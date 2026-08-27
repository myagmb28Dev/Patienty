package dev.patienty.examination;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record MeasurementRecord(UUID resultId, UUID examinationId, String metricCode, String displayName, BigDecimal value, String unit, BigDecimal referenceMin, BigDecimal referenceMax, String abnormalFlag, Instant occurredAt) {
    public String evidenceId() { return "examination-result:" + resultId; }
}
