package com.studyhub.chat.service;

import com.studyhub.config.GeminiConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
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
@RequiredArgsConstructor
public class GeminiApiService {

    private final GeminiConfig geminiConfig;
    private final RestTemplate restTemplate;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    /**
     * @param systemPrompt Ngữ cảnh tài liệu (document context)
     * @param history      Lịch sử chat [ {role, text}, ... ]
     * @param userQuestion Câu hỏi mới của user
     * @return Câu trả lời từ Gemini
     */
    public GeminiResponse chat(String systemPrompt,
            List<Map<String, String>> history,
            String userQuestion) {
        String url = String.format(GEMINI_BASE_URL,
                geminiConfig.getModel(), geminiConfig.getApiKey());

        List<Map<String, Object>> contents = buildContents(systemPrompt, history, userQuestion);

        Map<String, Object> requestBody = Map.of(
                "contents", contents,
                "generationConfig", Map.of(
                        "maxOutputTokens", geminiConfig.getMaxTokens(),
                        "temperature", geminiConfig.getTemperature()));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    Map.class);

            return parseResponse(response.getBody());
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
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
    private GeminiResponse parseResponse(Map<?, ?> body) {
        try {
            var candidates = (List<Map<?, ?>>) body.get("candidates");
            var content = (Map<?, ?>) candidates.get(0).get("content");
            var parts = (List<Map<?, ?>>) content.get("parts");
            String text = (String) parts.get(0).get("text");

            var usageMeta = (Map<?, ?>) body.get("usageMetadata");
            int totalTokens = usageMeta != null
                    ? ((Number) usageMeta.get("totalTokenCount")).intValue()
                    : 0;

            return new GeminiResponse(text.trim(), geminiConfig.getModel(), totalTokens);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response");
        }
    }

    public record GeminiResponse(String text, String model, int tokensUsed) {
    }
}
