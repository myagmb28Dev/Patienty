package dev.patienty.patient;
import java.time.Instant;import java.util.*;import org.springframework.format.annotation.DateTimeFormat;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/patients")
public class PatientController { private final PatientQueryService service; public PatientController(PatientQueryService service){this.service=service;}
    @GetMapping public PatientDtos.PageResponse<PatientDtos.PatientRow> search(@RequestParam(defaultValue="")String q,@RequestParam(defaultValue="")String department,@RequestParam(defaultValue="")String appointmentStatus,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(defaultValue="lastEncounterAt,desc")String sort){return service.search(q,department,appointmentStatus,page,size);}
    @GetMapping("/{patientId}") public PatientDtos.PatientDetail detail(@PathVariable String patientId){return service.detail(patientId);}
    @GetMapping("/{patientId}/timeline") public List<PatientDtos.TimelineItem> timeline(@PathVariable String patientId){return service.timeline(patientId);}
    @GetMapping("/{patientId}/measurements") public List<PatientDtos.MeasurementSeries> measurements(@PathVariable String patientId,@RequestParam(defaultValue="")String metric,@RequestParam(required=false)@DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME)Instant from,@RequestParam(required=false)@DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME)Instant to){return service.measurements(patientId,metric,from,to);}
}
