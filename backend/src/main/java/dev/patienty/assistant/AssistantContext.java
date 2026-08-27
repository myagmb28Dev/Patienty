package dev.patienty.assistant;
import java.time.Instant;import java.util.*;
public record AssistantContext(UUID patientId,List<ContextItem> items){public record ContextItem(String evidenceId,String sourceType,Instant occurredAt,String label,Map<String,String> facts){public ContextItem{facts=Map.copyOf(facts);}}}
