package com.studyhub.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "OLLAMA")
@RequiredArgsConstructor
public class OllamaApiService implements AiModelService {

    private final RestTemplate restTemplate;

    @Value("${ai.ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${ai.ollama.model:qwen2.5}")
    private String model;

    @Override
    public AiResponse chat(String systemPrompt,
                           List<Map<String, String>> history,
                           String userQuestion) {
        String url = baseUrl + "/api/chat";

        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        // History
        for (Map<String, String> msg : history) {
            String role = "USER".equals(msg.get("senderType")) ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.get("content")));
        }

        // User question
        messages.add(Map.of("role", "user", "content", userQuestion));

        Map<String, Object> requestBody;
        if (systemPrompt != null && (systemPrompt.toUpperCase().contains("JSON") || userQuestion.toUpperCase().contains("JSON"))) {
            requestBody = Map.of(
                    "model", model,
                    "messages", messages,
                    "stream", false,
                    "format", "json"
            );
        } else {
            requestBody = Map.of(
                    "model", model,
                    "messages", messages,
                    "stream", false
            );
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            log.info("Requesting Ollama Local ({}) to generate response...", model);
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    Map.class);

            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response from Ollama");
            }

            Map<?, ?> message = (Map<?, ?>) responseBody.get("message");
            String text = (String) message.get("content");

            // Token count is optional, Ollama returns prompt_eval_count + eval_count as usage
            int promptEvalCount = responseBody.get("prompt_eval_count") != null ? ((Number) responseBody.get("prompt_eval_count")).intValue() : 0;
            int evalCount = responseBody.get("eval_count") != null ? ((Number) responseBody.get("eval_count")).intValue() : 0;
            int totalTokens = promptEvalCount + evalCount;

            return new AiResponse(text.trim(), model, totalTokens);
        } catch (Exception e) {
            log.error("Ollama API call failed: {}", e.getMessage());
            throw new RuntimeException("Local AI service unavailable: " + e.getMessage());
        }
    }
}
