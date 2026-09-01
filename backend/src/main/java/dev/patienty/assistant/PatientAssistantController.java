package dev.patienty.assistant;

import dev.patienty.assistant.AssistantDtos.*;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/ai/queries")
public class PatientAssistantController {
    private final PatientAssistantService service;

    public PatientAssistantController(PatientAssistantService service) {
        this.service = service;
    }

    @PostMapping
    public AiQueryResponse ask(@PathVariable String patientId, @Valid @RequestBody AiQueryRequest request) {
        return service.answer(patientId, request.question().trim());
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAsk(@PathVariable String patientId, @Valid @RequestBody AiQueryRequest request) {
        SseEmitter emitter = new SseEmitter(60_000L);
        String question = request.question().trim();
        CompletableFuture.runAsync(() -> {
            try {
                AiQueryResponse response = service.answer(patientId, question);
                String fullText = response.answer();
                if (fullText != null && !fullText.isEmpty()) {
                    int chunkSize = Math.max(4, fullText.length() / 20);
                    for (int i = 0; i < fullText.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, fullText.length());
                        String chunk = fullText.substring(i, end);
                        emitter.send(SseEmitter.event().name("chunk").data(Map.of("text", chunk)));
                        try {
                            Thread.sleep(25);
                        } catch (InterruptedException ignored) {
                            Thread.currentThread().interrupt();
                        }
                    }
                }
                emitter.send(SseEmitter.event().name("done").data(response));
                emitter.complete();
            } catch (Exception ex) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(Map.of("message", "답변 생성 중 오류가 발생했습니다.")));
                } catch (IOException ignored) {
                }
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }
}
