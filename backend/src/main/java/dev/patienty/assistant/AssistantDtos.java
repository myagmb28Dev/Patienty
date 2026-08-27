package dev.patienty.assistant;
import dev.patienty.patient.PatientDtos.*;import jakarta.validation.constraints.*;import java.time.Instant;import java.util.List;
public final class AssistantDtos {private AssistantDtos(){}public record AiQueryRequest(@NotBlank(message="질문을 입력해 주세요.")@Size(max=500,message="질문은 500자 이하여야 합니다.")String question){}public record AiQueryResponse(String status,String answer,List<Observation> observations,List<Evidence> evidence,Instant generatedAt){}}
