package com.studyhub.chat.service;

import com.studyhub.config.GeminiConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiApiServiceTest {

    @Mock
    private GeminiConfig geminiConfig;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GeminiApiService geminiApiService;

    @BeforeEach
    void setUp() {
        lenient().when(geminiConfig.getModel()).thenReturn("gemini-2.5-flash-lite");
        lenient().when(geminiConfig.getApiKey()).thenReturn("test-api-key");
        lenient().when(geminiConfig.getMaxTokens()).thenReturn(2048);
        lenient().when(geminiConfig.getTemperature()).thenReturn(0.7);
    }

    @Test
    @SuppressWarnings("rawtypes")
    void testChat_Success() {
        // Prepare mock response body matching Gemini API format
        Map<String, Object> mockResponse = new HashMap<>();
        
        Map<String, Object> candidate = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(Map.of("text", "This is the AI response text.")));
        candidate.put("content", content);
        mockResponse.put("candidates", List.of(candidate));
        
        Map<String, Object> usageMetadata = new HashMap<>();
        usageMetadata.put("totalTokenCount", 150);
        mockResponse.put("usageMetadata", usageMetadata);

        ResponseEntity<Map> responseEntity = new ResponseEntity<>(mockResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);

        // Call method
        List<Map<String, String>> history = List.of(
                Map.of("senderType", "USER", "content", "Hello"),
                Map.of("senderType", "AI", "content", "Hi, how can I help you?")
        );
        GeminiApiService.GeminiResponse response = geminiApiService.chat(
                "System prompt content",
                history,
                "What is the capital of Vietnam?"
        );

        // Assertions
        assertNotNull(response);
        assertEquals("This is the AI response text.", response.text());
        assertEquals("gemini-2.5-flash-lite", response.model());
        assertEquals(150, response.tokensUsed());
    }

    @Test
    @SuppressWarnings("rawtypes")
    void testChat_ApiExceptionThrowsRuntimeException() {
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenThrow(new RuntimeException("Connection timeout"));

        assertThrows(RuntimeException.class, () -> {
            geminiApiService.chat("System", Collections.emptyList(), "Hello");
        });
    }
}
