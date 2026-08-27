package dev.patienty.patient;

import dev.patienty.appointment.*;
import dev.patienty.auth.*;
import dev.patienty.encounter.*;
import dev.patienty.examination.*;
import dev.patienty.insight.InsightService;
import dev.patienty.patient.PatientDtos.*;
import dev.patienty.prescription.*;
import dev.patienty.shared.ResourceNotFoundException;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class PatientQueryService {
    private static final Set<String> STATUSES=Set.of("SCHEDULED","CHECKED_IN","COMPLETED","CANCELLED","MISSED");
    private static final List<String> UPCOMING=List.of("SCHEDULED","CHECKED_IN");
    private static final ZoneId CLINIC_ZONE=ZoneId.of("Asia/Seoul");
    private final PatientRepository patients; private final AppointmentRepository appointments; private final DepartmentRepository departments;
    private final EncounterRepository encounters; private final ExaminationResultRepository examinations; private final PrescriptionItemRepository prescriptions;
    private final CurrentClinicianService current; private final InsightService insights; private final DashboardReadRepository dashboard; private final Clock clock=Clock.systemUTC();
    public PatientQueryService(PatientRepository patients,AppointmentRepository appointments,DepartmentRepository departments,EncounterRepository encounters,ExaminationResultRepository examinations,PrescriptionItemRepository prescriptions,CurrentClinicianService current,InsightService insights,DashboardReadRepository dashboard){
        this.patients=patients;this.appointments=appointments;this.departments=departments;this.encounters=encounters;this.examinations=examinations;this.prescriptions=prescriptions;this.current=current;this.insights=insights;this.dashboard=dashboard;
    }

    public PageResponse<PatientRow> search(String query,String department,String status,int page,int size){
        if(page<0||size<1||size>100)throw new IllegalArgumentException("page는 0 이상, size는 1~100이어야 합니다.");
        String normalizedStatus=normalize(status); if(!normalizedStatus.isEmpty()&&!STATUSES.contains(normalizedStatus))throw new IllegalArgumentException("지원하지 않는 예약 상태입니다.");
        Page<Patient> result=patients.searchAssigned(current.requireCurrent().getId(),trim(query),normalize(department),normalizedStatus,PageRequest.of(page,size));
        return PageResponse.from(result,result.getContent().stream().map(this::row).toList());
    }

    public PatientDetail detail(String identifier){
        Patient p=requireAssigned(identifier); UUID patientId=p.getId(); Optional<Encounter> encounter=latestEncounter(patientId); Optional<Appointment> next=nextAppointment(patientId);
        String code=encounter.map(Encounter::getDepartmentCode).or(()->next.map(Appointment::getDepartmentCode)).orElse(null);
        PatientHeader header=new PatientHeader(p.getId(),p.getPatientNumber(),p.getName(),p.getBirthDate(),age(p.getBirthDate()),p.getSexCode(),code,departmentName(code),encounter.map(Encounter::getOccurredAt).orElse(null),true);
        return new PatientDetail(header,next.map(this::appointment).orElse(null),currentPrescriptions(patientId),insights.summary(patientId));
    }
    public PatientDetail detail(UUID patientId){return detail(patientId.toString());}

    public List<TimelineItem> timeline(String identifier){
        Patient p=requireAssigned(identifier); UUID patientId=p.getId(); List<TimelineItem> items=new ArrayList<>();
        for(Encounter e:encounters.findTop20ByPatientIdAndStatusOrderByOccurredAtDesc(patientId,"COMPLETED")) items.add(new TimelineItem("encounter:"+e.getId(),"ENCOUNTER",e.getOccurredAt(),departmentName(e.getDepartmentCode())+" 진료",valueOr(e.getChiefComplaint(),"진료 기록")));
        Instant after=clock.instant().minus(365,ChronoUnit.DAYS);
        Map<UUID,List<MeasurementRecord>> byExam=new LinkedHashMap<>(); for(MeasurementRecord r:examinations.findMeasurements(patientId,"",after,clock.instant()))byExam.computeIfAbsent(r.examinationId(),ignored->new ArrayList<>()).add(r);
        for(List<MeasurementRecord> records:byExam.values()){String description=records.stream().map(r->(r.displayName()+" "+r.value().stripTrailingZeros().toPlainString()+" "+Objects.toString(r.unit(),"")).trim()).collect(java.util.stream.Collectors.joining(", "));items.add(new TimelineItem(records.get(0).evidenceId(),"EXAMINATION",records.get(0).occurredAt(),"검사 결과",description));}
        for(List<PrescriptionRecord> records:group(prescriptions.findRecent(patientId,after)).values()){String description=records.stream().map(r->r.medicationName()+" "+r.doseValue().stripTrailingZeros().toPlainString()+r.doseUnit()).collect(java.util.stream.Collectors.joining(", "));items.add(new TimelineItem(records.get(0).evidenceId(),"PRESCRIPTION",records.get(0).prescribedAt(),formatPrescriptionTitle(records.get(0).status()),description));}
        return items.stream().sorted(Comparator.comparing(TimelineItem::occurredAt).reversed()).limit(50).toList();
    }
    public List<TimelineItem> timeline(UUID patientId){return timeline(patientId.toString());}

    public List<MeasurementSeries> measurements(String identifier,String metric,Instant from,Instant to){
        Patient p=requireAssigned(identifier); UUID id=p.getId(); Instant end=to==null?clock.instant():to;
        return insights.measurements(id,metric,from==null?end.minus(365,ChronoUnit.DAYS):from,end);
    }
    public List<MeasurementSeries> measurements(UUID id,String metric,Instant from,Instant to){return measurements(id.toString(),metric,from,to);}

    public DashboardResponse dashboard(){
        UUID clinicianId=current.requireCurrent().getId();
        Instant now=clock.instant();
        Instant start=LocalDate.now(clock.withZone(CLINIC_ZONE)).atStartOfDay(CLINIC_ZONE).toInstant(),end=start.plus(1,ChronoUnit.DAYS);
        List<DashboardAppointment> today=dashboard.findTodayAppointments(clinicianId,start,end);
        List<PatientRow> review=dashboard.findPatientsNeedingReview(clinicianId,now.minus(183,ChronoUnit.DAYS),now).stream()
                .map(p->new PatientRow(p.id(),p.patientNumber(),p.name(),p.birthDate(),age(p.birthDate()),p.sexCode(),p.departmentCode(),p.departmentName(),p.lastEncounterAt(),p.nextAppointmentAt(),p.attentionCount()))
                .toList();
        return new DashboardResponse(today,review);
    }

    public Patient requireAssigned(String identifier){
        if(identifier==null||identifier.isBlank())throw new ResourceNotFoundException("환자를 찾을 수 없습니다.");
        UUID parsedUuid=null;
        try{parsedUuid=UUID.fromString(identifier.trim());}catch(IllegalArgumentException ignored){}
        Clinician c=current.requireCurrent();
        return patients.findAssignedByIdOrNumber(c.getId(),parsedUuid,identifier.trim()).orElseThrow(()->new ResourceNotFoundException("환자를 찾을 수 없습니다."));
    }
    public Patient requireAssigned(UUID id){Clinician c=current.requireCurrent();return patients.findAssignedById(c.getId(),id).orElseThrow(()->new ResourceNotFoundException("환자를 찾을 수 없습니다."));}
    private PatientRow row(Patient p){Optional<Encounter> e=latestEncounter(p.getId());Optional<Appointment>a=nextAppointment(p.getId());String code=e.map(Encounter::getDepartmentCode).or(()->a.map(Appointment::getDepartmentCode)).orElse(null);return new PatientRow(p.getId(),p.getPatientNumber(),p.getName(),p.getBirthDate(),age(p.getBirthDate()),p.getSexCode(),code,departmentName(code),e.map(Encounter::getOccurredAt).orElse(null),a.map(Appointment::getScheduledStart).orElse(null),insights.attentionCount(p.getId()));}
    private List<PrescriptionSummary> currentPrescriptions(UUID id){return group(prescriptions.findByPatientAndStatuses(id,List.of("ACTIVE"))).values().stream().map(records->{PrescriptionRecord h=records.get(0);return new PrescriptionSummary(h.prescriptionId(),h.prescribedAt(),h.status(),records.stream().map(r->new PrescriptionItemSummary(r.itemId(),r.medicationCode(),r.medicationName(),r.doseValue(),r.doseUnit(),r.frequencyPerDay(),r.route(),r.startDate(),r.endDate(),r.instructions())).toList());}).toList();}
    private static Map<UUID,List<PrescriptionRecord>> group(List<PrescriptionRecord> records){Map<UUID,List<PrescriptionRecord>> map=new LinkedHashMap<>();for(PrescriptionRecord r:records)map.computeIfAbsent(r.prescriptionId(),ignored->new ArrayList<>()).add(r);return map;}
    private AppointmentSummary appointment(Appointment a){return new AppointmentSummary(a.getId(),a.getDepartmentCode(),departmentName(a.getDepartmentCode()),a.getScheduledStart(),a.getScheduledEnd(),a.getStatus(),a.getReason());}
    private Optional<Encounter> latestEncounter(UUID id){return encounters.findFirstByPatientIdAndStatusOrderByOccurredAtDesc(id,"COMPLETED");}
    private Optional<Appointment> nextAppointment(UUID id){return appointments.findFirstByPatientIdAndScheduledStartAfterAndStatusInOrderByScheduledStartAsc(id,clock.instant(),UPCOMING);}
    private String departmentName(String code){return code==null?null:departments.findById(code).map(Department::getDisplayName).orElse(code);}
    private int age(LocalDate birth){return Period.between(birth,LocalDate.now(clock.withZone(CLINIC_ZONE))).getYears();}
    private static String formatPrescriptionTitle(String status){if(status==null)return "처방 기록";return switch(status.toUpperCase()){case "ACTIVE"->"유지 처방";case "SUPERSEDED"->"처방 변경";case "SUSPENDED","SUSPEND","STOPPED"->"처방 중단";case "CANCELLED","CANCELED"->"처방 취소";case "COMPLETED"->"처방 완료";default->"처방 내역";};}
    private static String trim(String v){return v==null?"":v.trim();} private static String normalize(String v){return trim(v).toUpperCase();} private static String valueOr(String v,String fallback){return v==null||v.isBlank()?fallback:v;}
}
