package dev.patienty.examination;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "examination_result")
public class ExaminationResult {
    @Id private UUID id;
    @Column(name = "examination_id", nullable = false) private UUID examinationId;
    @Column(name = "metric_code", nullable = false) private String metricCode;
    @Column(name = "display_name", nullable = false) private String displayName;
    @Column(name = "numeric_value") private BigDecimal numericValue;
    @Column(name = "text_value") private String textValue;
    private String unit;
    @Column(name = "reference_min") private BigDecimal referenceMin;
    @Column(name = "reference_max") private BigDecimal referenceMax;
    @Column(name = "abnormal_flag", nullable = false) private String abnormalFlag;
    protected ExaminationResult() {}
    public UUID getId() { return id; }
    public UUID getExaminationId() { return examinationId; }
    public String getMetricCode() { return metricCode; }
    public String getDisplayName() { return displayName; }
    public BigDecimal getNumericValue() { return numericValue; }
    public String getTextValue() { return textValue; }
    public String getUnit() { return unit; }
    public BigDecimal getReferenceMin() { return referenceMin; }
    public BigDecimal getReferenceMax() { return referenceMax; }
    public String getAbnormalFlag() { return abnormalFlag; }
}
