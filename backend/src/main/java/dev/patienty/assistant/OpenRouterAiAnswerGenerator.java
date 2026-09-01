package dev.patienty.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.patienty.patient.PatientDtos.Observation;
import dev.patienty.patient.PatientDtos.PatientSummary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Primary
@Component
@ConditionalOnProperty(name = "patienty.ai.provider", havingValue = "openrouter", matchIfMissing = true)
public class OpenRouterAiAnswerGenerator implements AiAnswerGenerator {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterAiAnswerGenerator.class);
    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("(?s)```(?:json)?\\s*(.*?)\\s*```");

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final RuleBasedAiAnswerGenerator fallback;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OpenRouterAiAnswerGenerator(
            @Value("${patienty.ai.openrouter.api-key:}") String apiKey,
            @Value("${patienty.ai.openrouter.model:google/gemini-2.5-flash}") String model,
            @Value("${patienty.ai.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            RuleBasedAiAnswerGenerator fallback) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "google/gemini-2.5-flash";
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "https://openrouter.ai/api/v1";

        this.fallback = fallback;
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(25));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(this.baseUrl)
                .build();
    }

    @Override
    public GeneratedAnswer generate(String question, AssistantIntent intent, AssistantContext context, PatientSummary summary) {
        if (apiKey.isBlank()) {
            log.info("OPENROUTER_API_KEY is not set. Falling back to RuleBasedAiAnswerGenerator.");
            return fallback.generate(question, intent, context, summary);
        }

        try {
            return callOpenRouter(question, intent, context, summary);
        } catch (Exception e) {
            log.warn("OpenRouter API call failed ({}: {}). Gracefully falling back to RuleBased generator.", 
                    e.getClass().getSimpleName(), e.getMessage());
            return fallback.generate(question, intent, context, summary);
        }
    }

    private GeneratedAnswer callOpenRouter(String question, AssistantIntent intent, AssistantContext context, PatientSummary summary) throws Exception {
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(question, intent, context, summary);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("model", model);
        requestPayload.put("temperature", 0.2);
        requestPayload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));

        String requestBody = objectMapper.writeValueAsString(requestPayload);

        String rawResponse = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("HTTP-Referer", "http://localhost:3000")
                .header("X-Title", "Patienty")
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseResponse(rawResponse, context, question, intent, summary);
    }

    private GeneratedAnswer parseResponse(String rawResponse, AssistantContext context, String question, AssistantIntent intent, PatientSummary summary) throws Exception {
        JsonNode root = objectMapper.readTree(rawResponse);
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new IllegalStateException("Empty choices returned from OpenRouter");
        }

        String content = choices.get(0).path("message").path("content").asText("");
        if (content.isBlank()) {
            throw new IllegalStateException("Empty content returned from OpenRouter model");
        }

        String jsonText = extractJson(content);
        JsonNode parsed = objectMapper.readTree(jsonText);

        String answer = parsed.path("answer").asText("");
        if (answer.isBlank()) {
            answer = summary.text();
        }

        Set<String> validEvidenceIds = new HashSet<>();
        context.items().forEach(item -> validEvidenceIds.add(item.evidenceId()));

        List<Observation> observations = new ArrayList<>();
        JsonNode obsNode = parsed.path("observations");
        if (obsNode.isArray()) {
            for (JsonNode o : obsNode) {
                String type = o.path("type").asText("INFORMATION");
                String level = o.path("level").asText("INFORMATION");
                String text = o.path("text").asText("");
                List<String> evidenceIds = new ArrayList<>();

                JsonNode evIds = o.path("evidenceIds");
                if (evIds.isArray()) {
                    for (JsonNode idNode : evIds) {
                        String id = idNode.asText();
                        if (validEvidenceIds.contains(id)) {
                            evidenceIds.add(id);
                        }
                    }
                }

                // If evidenceIds is empty, try attaching first relevant evidence
                if (evidenceIds.isEmpty() && !validEvidenceIds.isEmpty()) {
                    evidenceIds.add(validEvidenceIds.iterator().next());
                }

                if (!text.isBlank() && !evidenceIds.isEmpty()) {
                    observations.add(new Observation(type, level, text, evidenceIds));
                }
            }
        }

        if (observations.isEmpty()) {
            // fallback observation
            return fallback.generate(question, intent, context, summary);
        }

        return new GeneratedAnswer(answer, observations);
    }

    private String extractJson(String raw) {
        Matcher matcher = JSON_BLOCK_PATTERN.matcher(raw);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return raw.substring(start, end + 1).trim();
        }
        return raw.trim();
    }

    private String buildSystemPrompt() {
        return """
                당신은 병원 EMR 시스템 'Patienty'의 임상 데이터 분석 전문 AI 어시스턴트입니다.
                의료진(의사)의 질문과 제공된 환자 의무기록(Context Items)을 분석하여 핵심 소견과 관찰 변화를 정리하십시오.

                [엄격한 준수 규칙]
                1. 진단이나 약물 처방을 임의로 내리지 말고, 오직 기록된 사실(검사 수치 추이, 처방 변경, 진료 기록)만을 바탕으로 분석하십시오.
                2. 제공된 데이터에 없는 내용은 절대 지어내지 마십시오(환각 금지).
                3. observations 배열의 각 관찰 항목에는 반드시 해당 사실의 근거가 되는 제공된 정확한 evidenceId 문자열을 evidenceIds 배열에 포함해야 합니다.
                4. 한국어로 정중하고 전문적인 임상 어조로 작성하십시오.

                [응답 JSON 형식 - 반드시 마크다운 백틱 없이 순수 JSON만 반환]
                {
                  "answer": "종합 임상 소견 요약 문장",
                  "observations": [
                    {
                      "type": "MEASUREMENT_TREND" | "MEDICATION_CHANGE" | "RECENT_EXAMINATIONS" | "ENCOUNTER_TIMELINE" | "INFORMATION",
                      "level": "NORMAL" | "ATTENTION" | "WARNING" | "INFORMATION",
                      "text": "감지된 구체적 변화 내용",
                      "evidenceIds": ["evidenceId1", "evidenceId2"]
                    }
                  ]
                }
                """;
    }

    private String buildUserPrompt(String question, AssistantIntent intent, AssistantContext context, PatientSummary summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("[의사 질의]\n").append(question).append("\n\n");
        sb.append("[질의 의도]\n").append(intent.name()).append("\n\n");
        sb.append("[환자 기본 요약]\n").append(summary.text()).append("\n\n");
        sb.append("[제공된 의무기록 데이터]\n");
        for (AssistantContext.ContextItem item : context.items()) {
            sb.append("- 일시: ").append(item.occurredAt())
              .append(" | 종류: ").append(item.sourceType())
              .append(" | 항목: ").append(item.label())
              .append(" | ID: ").append(item.evidenceId())
              .append(" | 상세데이터: ").append(item.facts())
              .append("\n");
        }
        return sb.toString();
    }
}