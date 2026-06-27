package com.studyhub.chat.service;

import java.util.List;
import java.util.Map;

public interface AiModelService {
    AiResponse chat(String systemPrompt, List<Map<String, String>> history, String userQuestion);

    record AiResponse(String text, String model, int tokensUsed) {}
}
