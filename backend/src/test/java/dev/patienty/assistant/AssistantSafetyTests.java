package dev.patienty.assistant;
import static org.assertj.core.api.Assertions.*;
import dev.patienty.assistant.AssistantContext.ContextItem;import dev.patienty.patient.PatientDtos.Observation;import java.time.Instant;import java.util.*;import org.junit.jupiter.api.Test;
class AssistantSafetyTests {private final IntentResolver resolver=new IntentResolver();private final EvidenceValidator validator=new EvidenceValidator();
    @Test void rejectsClinicalAdvice(){assertThat(resolver.resolve("이 환자를 진단해줘")).isEqualTo(AssistantIntent.UNSUPPORTED);assertThat(resolver.resolve("recommend medication")).isEqualTo(AssistantIntent.UNSUPPORTED);}
    @Test void permitsMedicationHistory(){assertThat(resolver.resolve("지난 방문 이후 변경된 처방이 뭐야?")).isEqualTo(AssistantIntent.MEDICATION_CHANGES);}
    @Test void rejectsFabricatedEvidence(){AssistantContext context=new AssistantContext(UUID.randomUUID(),List.of(new ContextItem("encounter:known","ENCOUNTER",Instant.parse("2026-08-20T00:00:00Z"),"진료",Map.of())));assertThatThrownBy(()->validator.validate(context,List.of(new Observation("CHANGE","INFORMATION","text",List.of("encounter:made-up"))))).isInstanceOf(IllegalStateException.class);}}
