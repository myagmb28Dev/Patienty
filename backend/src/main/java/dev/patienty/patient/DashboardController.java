package dev.patienty.patient;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/dashboard")
public class DashboardController {private final PatientQueryService service;public DashboardController(PatientQueryService service){this.service=service;}@GetMapping public PatientDtos.DashboardResponse dashboard(){return service.dashboard();}}
