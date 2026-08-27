package dev.patienty.examination;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface ExaminationResultRepository extends JpaRepository<ExaminationResult, UUID> {
    @Query("""
            select new dev.patienty.examination.MeasurementRecord(r.id,e.id,r.metricCode,r.displayName,r.numericValue,r.unit,r.referenceMin,r.referenceMax,r.abnormalFlag,e.performedAt)
            from ExaminationResult r join Examination e on e.id=r.examinationId
            where e.patientId=:patientId and e.status='FINAL' and e.performedAt>=:from and e.performedAt<=:to
              and r.numericValue is not null and (:metricCode='' or r.metricCode=:metricCode)
            order by e.performedAt asc,e.id asc,r.id asc
            """)
    List<MeasurementRecord> findMeasurements(@Param("patientId") UUID patientId, @Param("metricCode") String metricCode, @Param("from") Instant from, @Param("to") Instant to);
}
