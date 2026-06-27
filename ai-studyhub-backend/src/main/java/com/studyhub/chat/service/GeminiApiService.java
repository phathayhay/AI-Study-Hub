package com.studyhub.chat.service;

import com.studyhub.config.GeminiConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Gọi Gemini API (REST) để sinh câu trả lời cho chatbot.
 *
 * Endpoint: POST
 * https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *
 * Payload cơ bản:
 * {
 * "contents": [
 * { "role": "user", "parts": [{ "text": "..." }] },
 * { "role": "model", "parts": [{ "text": "..." }] },
 * ...
 * ],
 * "generationConfig": { "maxOutputTokens": 2048, "temperature": 0.7 }
 * }
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "GEMINI", matchIfMissing = true)
@RequiredArgsConstructor
public class GeminiApiService implements AiModelService {

    private final GeminiConfig geminiConfig;
    private final RestTemplate restTemplate;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    /**
     * @param systemPrompt Ngữ cảnh tài liệu (document context)
     * @param history      Lịch sử chat [ {role, text}, ... ]
     * @param userQuestion Câu hỏi mới của user
     * @return Câu trả lời từ Gemini
     */
    @Override
    public AiResponse chat(String systemPrompt,
            List<Map<String, String>> history,
            String userQuestion) {
        String url = String.format(GEMINI_BASE_URL,
                geminiConfig.getModel(), geminiConfig.getApiKey());

        List<Map<String, Object>> contents = buildContents(systemPrompt, history, userQuestion);

        java.util.Map<String, Object> generationConfig = new java.util.HashMap<>();
        generationConfig.put("maxOutputTokens", geminiConfig.getMaxTokens());
        generationConfig.put("temperature", geminiConfig.getTemperature());

        if ((systemPrompt != null && systemPrompt.toUpperCase().contains("JSON")) ||
                (userQuestion != null && userQuestion.toUpperCase().contains("JSON"))) {
            generationConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> requestBody = Map.of(
                "contents", contents,
                "generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        int maxRetries = 3;
        int delayMs = 2000;
        Exception lastException = null;

        for (int i = 0; i < maxRetries; i++) {
            try {
                log.info("Calling Gemini API (attempt {}/{} using model: {})...", i + 1, maxRetries, geminiConfig.getModel());
                ResponseEntity<Map> response = restTemplate.exchange(
                        url, HttpMethod.POST,
                        new HttpEntity<>(requestBody, headers),
                        Map.class);

                return parseResponse(response.getBody());
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini API call failed on attempt {} due to: {}. Retrying in {}ms...", i + 1, e.getMessage(), delayMs);
                if (i < maxRetries - 1) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("AI service interrupted: " + ie.getMessage());
                    }
                }
            }
        }
        log.error("All {} attempts to call Gemini API failed.", maxRetries);
        throw new RuntimeException("AI service unavailable: " + (lastException != null ? lastException.getMessage() : "Unknown error"));
    }

    private List<Map<String, Object>> buildContents(
            String systemPrompt,
            List<Map<String, String>> history,
            String userQuestion) {

        var contents = new java.util.ArrayList<Map<String, Object>>();

        // System context as first user turn
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text",
                            "Bạn là trợ lý học tập AI. Hãy trả lời dựa trên tài liệu sau:\n\n"
                                    + systemPrompt))));
            contents.add(Map.of(
                    "role", "model",
                    "parts", List.of(Map.of("text",
                            "Tôi đã đọc tài liệu. Hãy hỏi bất kỳ điều gì liên quan!"))));
        }

        // Chat history
        for (Map<String, String> msg : history) {
            String role = "USER".equals(msg.get("senderType")) ? "user" : "model";
            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(Map.of("text", msg.get("content")))));
        }

        // Current question
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userQuestion))));

        return contents;
    }

    @SuppressWarnings("unchecked")
    private AiResponse parseResponse(Map<?, ?> body) {
        try {
            var candidates = (List<Map<?, ?>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new IllegalArgumentException("No candidates returned from Gemini");
            }
            var firstCandidate = candidates.get(0);
            String finishReason = (String) firstCandidate.get("finishReason");
            log.info("Gemini candidate finishReason: {}", finishReason);

            var content = (Map<?, ?>) firstCandidate.get("content");
            var parts = (List<Map<?, ?>>) content.get("parts");
            String text = (String) parts.get(0).get("text");

            var usageMeta = (Map<?, ?>) body.get("usageMetadata");
            int totalTokens = usageMeta != null
                    ? ((Number) usageMeta.get("totalTokenCount")).intValue()
                    : 0;

            return new AiResponse(text.trim(), geminiConfig.getModel(), totalTokens);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }
}
