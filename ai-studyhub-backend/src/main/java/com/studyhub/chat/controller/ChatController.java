package com.studyhub.chat.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.chat.dto.*;
import com.studyhub.chat.service.ChatService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chatbot", description = "AI-powered chatbot conversation APIs")
public class ChatController {

    private final ChatService chatService;

    // API tạo phiên trò chuyện mới (có thể có ngữ cảnh tài liệu hoặc không)
    @PostMapping("/sessions")
    @Operation(summary = "Create a new chat session", description = "Starts a new chat session. Optionally links it to a document context for targeted AI Q&A.")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession(@RequestBody CreateSessionRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Creating new chat session for user {}", email);
        ChatSessionResponse response = chatService.createSession(request, email);
        return ResponseEntity.ok(ApiResponse.ok("Chat session created successfully", response));
    }

    // API lấy danh sách các phiên trò chuyện của người dùng hiện tại
    @GetMapping("/sessions")
    @Operation(summary = "Get user's chat sessions", description = "Retrieves all chat sessions for the currently authenticated user, ordered by most recently updated.")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getUserSessions() {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Retrieving chat sessions for user {}", email);
        List<ChatSessionResponse> response = chatService.getUserSessions(email);
        return ResponseEntity.ok(ApiResponse.ok("Chat sessions retrieved successfully", response));
    }

    // API lấy toàn bộ tin nhắn trong một phiên trò chuyện cụ thể
    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Get messages history", description = "Retrieves the full message history for a specific chat session.")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getSessionMessages(@PathVariable Long sessionId) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Retrieving messages for session {} by user {}", sessionId, email);
        List<ChatMessageResponse> response = chatService.getSessionMessages(sessionId, email);
        return ResponseEntity.ok(ApiResponse.ok("Session messages retrieved successfully", response));
    }

    // API gửi tin nhắn mới và nhận phản hồi trực tiếp từ AI
    @PostMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Send chat message", description = "Sends a new message to the chat session, gets contextual AI response from Gemini, and returns the AI's reply.")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long sessionId,
            @Valid @RequestBody SendMessageRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Sending message to session {} by user {}", sessionId, email);
        ChatMessageResponse response = chatService.sendMessage(sessionId, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Message sent and reply received", response));
    }
}
