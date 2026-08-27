package dev.patienty.insight;

import dev.patienty.examination.*;
import dev.patienty.patient.PatientDtos.*;
import dev.patienty.prescription.*;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class InsightService {
    private final ExaminationResultRepository examinations;
    private final PrescriptionItemRepository prescriptions;
    private final Clock clock;
    @org.springframework.beans.factory.annotation.Autowired public InsightService(ExaminationResultRepository examinations, PrescriptionItemRepository prescriptions) { this(examinations,prescriptions,Clock.systemUTC()); }
    InsightService(ExaminationResultRepository examinations, PrescriptionItemRepository prescriptions, Clock clock) { this.examinations=examinations; this.prescriptions=prescriptions; this.clock=clock; }

    public List<MeasurementSeries> measurements(UUID patientId,String metricCode,Instant from,Instant to) {
        if (from.isAfter(to)) throw new IllegalArgumentException("from은 to보다 늦을 수 없습니다.");
        if (Duration.between(from,to).toDays()>366L*5) throw new IllegalArgumentException("측정값 조회 기간은 최대 5년입니다.");
        Map<String,List<MeasurementRecord>> groups=new LinkedHashMap<>();
        for (MeasurementRecord r:examinations.findMeasurements(patientId,normalize(metricCode),from,to)) groups.computeIfAbsent(r.metricCode()+"\0"+Objects.toString(r.unit(),""),ignored->new ArrayList<>()).add(r);
        return groups.values().stream().map(this::series).toList();
    }

    public PatientSummary summary(UUID patientId) {
        Instant now=clock.instant();
        List<MeasurementSeries> series=measurements(patientId,"",now.minus(183,ChronoUnit.DAYS),now);
        List<PrescriptionRecord> rx=prescriptions.findRecent(patientId,now.minus(183,ChronoUnit.DAYS));
        List<Observation> observations=new ArrayList<>(); Map<String,Evidence> evidence=new LinkedHashMap<>();
        for (MeasurementSeries s:series) {
            if (s.points().size()>=2 && !"STABLE".equals(s.trendDirection())) {
                MeasurementPoint first=s.points().get(0), last=s.points().get(s.points().size()-1);
                observations.add(new Observation("MEASUREMENT_TREND","NORMAL".equals(last.abnormalFlag())?"INFORMATION":"ATTENTION",
                        "%s이(가) %s에서 %s %s(으)로 변했습니다.".formatted(s.displayName(),plain(first.value()),plain(last.value()),Objects.toString(s.unit(),"")),List.of(first.evidenceId(),last.evidenceId())));
                evidence.put(first.evidenceId(),measurementEvidence(s,first)); evidence.put(last.evidenceId(),measurementEvidence(s,last));
            } else if (s.points().stream().anyMatch(p->!"NORMAL".equals(p.abnormalFlag()))) {
                MeasurementPoint latest=s.points().get(s.points().size()-1);
                observations.add(new Observation("ABNORMAL_RESULT","ATTENTION",s.displayName()+" 최신 결과에 검토 표시가 있습니다.",List.of(latest.evidenceId())));
                evidence.put(latest.evidenceId(),measurementEvidence(s,latest));
            }
        }
        addPrescriptionChange(rx,observations,evidence);
        List<String> missing=new ArrayList<>(); if(series.isEmpty()) missing.add("EXAMINATION"); if(rx.isEmpty()) missing.add("PRESCRIPTION");
        String text=observations.isEmpty()?(missing.size()==2?"요약할 수 있는 최근 기록이 충분하지 않습니다.":"최근 기록에서 두드러진 변화가 확인되지 않았습니다."):"최근 6개월 기록에서 %d개의 검토 항목을 찾았습니다.".formatted(observations.size());
        return new PatientSummary(text,List.copyOf(observations),List.copyOf(evidence.values()),missing);
    }
    public int attentionCount(UUID patientId) { return (int)summary(patientId).observations().stream().filter(o->"ATTENTION".equals(o.level())).count(); }

    private MeasurementSeries series(List<MeasurementRecord> records) {
        records.sort(Comparator.comparing(MeasurementRecord::occurredAt)); MeasurementRecord first=records.get(0);
        List<MeasurementPoint> points=records.stream().map(r->new MeasurementPoint(r.evidenceId(),r.occurredAt(),r.value(),r.referenceMin(),r.referenceMax(),r.abnormalFlag())).toList();
        BigDecimal delta=records.size()<2?null:records.get(records.size()-1).value().subtract(first.value()).setScale(4,RoundingMode.HALF_UP).stripTrailingZeros();
        String direction=delta==null?"INSUFFICIENT_DATA":delta.abs().compareTo(new BigDecimal("0.01"))<0?"STABLE":delta.signum()>0?"UP":"DOWN";
        return new MeasurementSeries(first.metricCode(),first.displayName(),first.unit(),points,direction,delta);
    }
    private static void addPrescriptionChange(List<PrescriptionRecord> records,List<Observation> observations,Map<String,Evidence> evidence) {
        Map<UUID,List<PrescriptionRecord>> grouped=new LinkedHashMap<>(); for(PrescriptionRecord r:records) grouped.computeIfAbsent(r.prescriptionId(),ignored->new ArrayList<>()).add(r);
        if(grouped.size()<2)return; Iterator<Map.Entry<UUID,List<PrescriptionRecord>>> it=grouped.entrySet().iterator(); var latest=it.next(); var previous=it.next();
        if(!doses(latest.getValue()).equals(doses(previous.getValue()))) {
            PrescriptionRecord l=latest.getValue().get(0),p=previous.getValue().get(0);
            observations.add(new Observation("MEDICATION_CHANGE","ATTENTION","최근 두 처방 사이에 약물 또는 용량 변경이 있습니다.",List.of(p.evidenceId(),l.evidenceId())));
            evidence.put(p.evidenceId(),new Evidence(p.evidenceId(),"PRESCRIPTION",p.prescribedAt(),"처방 기록")); evidence.put(l.evidenceId(),new Evidence(l.evidenceId(),"PRESCRIPTION",l.prescribedAt(),"처방 기록"));
        }
    }
    private static Map<String,String> doses(List<PrescriptionRecord> records) { Map<String,String> map=new TreeMap<>(); for(PrescriptionRecord r:records) map.put(r.medicationCode(),plain(r.doseValue())+r.doseUnit()+"x"+plain(r.frequencyPerDay())); return map; }
    private static Evidence measurementEvidence(MeasurementSeries s,MeasurementPoint p){return new Evidence(p.evidenceId(),"EXAMINATION_RESULT",p.occurredAt(),s.displayName()+" 검사 결과");}
    private static String plain(BigDecimal v){return v.stripTrailingZeros().toPlainString();}
    private static String normalize(String v){return v==null?"":v.trim().toUpperCase();}
}
