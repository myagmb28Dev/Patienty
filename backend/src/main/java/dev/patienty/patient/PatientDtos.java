package dev.patienty.patient;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.Page;

public final class PatientDtos {
    private PatientDtos() {}
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        public static <S,T> PageResponse<T> from(Page<S> source, List<T> content) { return new PageResponse<>(content,source.getNumber(),source.getSize(),source.getTotalElements(),source.getTotalPages()); }
    }
    public record PatientRow(UUID id,String patientNumber,String name,LocalDate birthDate,int age,String sexCode,String departmentCode,String departmentName,Instant lastEncounterAt,Instant nextAppointmentAt,int attentionCount) {}
    public record PatientHeader(UUID id,String patientNumber,String name,LocalDate birthDate,int age,String sexCode,String departmentCode,String departmentName,Instant lastEncounterAt,boolean synthetic) {}
    public record AppointmentSummary(UUID id,String departmentCode,String departmentName,Instant scheduledStart,Instant scheduledEnd,String status,String reason) {}
    public record PrescriptionSummary(UUID id,Instant prescribedAt,String status,List<PrescriptionItemSummary> items) {}
    public record PrescriptionItemSummary(UUID id,String medicationCode,String medicationName,BigDecimal doseValue,String doseUnit,BigDecimal frequencyPerDay,String route,LocalDate startDate,LocalDate endDate,String instructions) {}
    public record Observation(String type,String level,String text,List<String> evidenceIds) {}
    public record Evidence(String id,String sourceType,Instant occurredAt,String label) {}
    public record PatientSummary(String text,List<Observation> observations,List<Evidence> evidence,List<String> missingRecordCategories) {}
    public record PatientDetail(PatientHeader header,AppointmentSummary nextAppointment,List<PrescriptionSummary> currentPrescriptions,PatientSummary summary) {}
    public record TimelineItem(String evidenceId,String type,Instant occurredAt,String title,String description) {}
    public record MeasurementPoint(String evidenceId,Instant occurredAt,BigDecimal value,BigDecimal referenceMin,BigDecimal referenceMax,String abnormalFlag) {}
    public record MeasurementSeries(String metricCode,String displayName,String unit,List<MeasurementPoint> points,String trendDirection,BigDecimal delta) {}
    public record DashboardAppointment(UUID appointmentId,UUID patientId,String patientNumber,String patientName,String departmentCode,String departmentName,Instant scheduledStart,String status,String reason) {}
    public record DashboardResponse(List<DashboardAppointment> todayAppointments,List<PatientRow> patientsNeedingReview) {}
}
