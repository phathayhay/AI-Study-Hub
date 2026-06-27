package com.studyhub.chat.service;

import com.studyhub.chat.dto.*;
import com.studyhub.chat.entity.ChatMessage;
import com.studyhub.chat.entity.ChatSession;
import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.chat.repository.ChatSessionRepository;
import com.studyhub.common.enums.SenderType;
import com.studyhub.document.entity.Document;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.service.TextExtractionService;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final TextExtractionService textExtractionService;
    private final AiModelService aiModelService;

    /**
     * Tạo một phiên trò chuyện mới.
     */
    @Transactional
    public ChatSessionResponse createSession(CreateSessionRequest request, String email) {
        log.info("Creating chat session for user: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document document = null;
        if (request.getDocumentId() != null) {
            document = documentRepository.findById(request.getDocumentId())
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        }

        String title = request.getSessionTitle();
        if (title == null || title.isBlank()) {
            if (document != null) {
                title = "Trò chuyện về: " + document.getTitle();
            } else {
                title = "Cuộc trò chuyện mới";
            }
        }

        ChatSession session = ChatSession.builder()
                .user(user)
                .document(document)
                .sessionTitle(title)
                .build();

        ChatSession saved = chatSessionRepository.save(session);
        return mapToSessionResponse(saved);
    }

    /**
     * Lấy danh sách các phiên trò chuyện của người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserSessions(String email) {
        log.info("Fetching chat sessions for user: {}", email);
        return chatSessionRepository.findByUser_EmailOrderByUpdatedAtDesc(email).stream()
                .map(this::mapToSessionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tin nhắn trong một phiên trò chuyện.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getSessionMessages(Long sessionId, String email) {
        log.info("Fetching messages for session: {} by user: {}", sessionId, email);
        // Kiểm tra quyền sở hữu phiên chat
        chatSessionRepository.findByIdAndUser_Email(sessionId, email)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found or access denied"));

        return chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(sessionId).stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gửi tin nhắn mới và nhận câu trả lời từ Gemini AI.
     */
    @Transactional
    public ChatMessageResponse sendMessage(Long sessionId, SendMessageRequest request, String email) {
        log.info("User {} sending message to session: {}", email, sessionId);
        ChatSession session = chatSessionRepository.findByIdAndUser_Email(sessionId, email)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found or access denied"));

        // 1. Lưu tin nhắn của User
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .senderType(SenderType.USER)
                .messageContent(request.getContent())
                .tokensUsed(0)
                .build();
        chatMessageRepository.save(userMessage);

        // 2. Lấy lịch sử trò chuyện (tất cả các tin nhắn trước đó trong session)
        List<ChatMessage> historyMessages = chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(sessionId);

        // Chuyển đổi lịch sử chat phù hợp định dạng Gemini API (loại trừ câu hỏi hiện tại)
        List<Map<String, String>> history = historyMessages.stream()
                .filter(m -> !m.getId().equals(userMessage.getId()))
                .map(m -> Map.of(
                        "senderType", m.getSenderType().name(),
                        "content", m.getMessageContent()
                ))
                .collect(Collectors.toList());

        // 3. Xây dựng System Prompt (Ngữ cảnh tài liệu hoặc Trợ lý mặc định)
        String systemPrompt = "Bạn là trợ lý học tập AI của hệ thống AI Study Hub FPT. Hãy trả lời các câu hỏi học thuật của sinh viên bằng Tiếng Việt một cách khoa học, rõ ràng và chi tiết.";
        if (session.getDocument() != null) {
            try {
                String fileUrl = session.getDocument().getFileUrl();
                String documentText = textExtractionService.extractTextFromUrl(fileUrl);
                if (documentText != null && !documentText.isBlank()) {
                    String truncatedText = documentText.substring(0, Math.min(documentText.length(), 15000));
                    systemPrompt = "Bạn là trợ lý học tập AI. Hãy trả lời các câu hỏi dựa trên nội dung tài liệu sau đây:\n\n" + truncatedText;
                }
            } catch (Exception e) {
                log.warn("Failed to extract context from document id: {}. Error: {}", session.getDocument().getId(), e.getMessage());
            }
        }

        // 4. Gọi AI
        AiModelService.AiResponse geminiResponse = aiModelService.chat(
                systemPrompt,
                history,
                request.getContent()
        );

        // 5. Lưu câu trả lời của AI
        ChatMessage aiMessage = ChatMessage.builder()
                .session(session)
                .senderType(SenderType.AI)
                .messageContent(geminiResponse.text())
                .tokensUsed(geminiResponse.tokensUsed())
                .build();
        ChatMessage savedAi = chatMessageRepository.save(aiMessage);

        // 6. Cập nhật thời gian thay đổi của phiên làm việc
        session.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(session);

        return mapToMessageResponse(savedAi);
    }

    private ChatSessionResponse mapToSessionResponse(ChatSession session) {
        return ChatSessionResponse.builder()
                .id(session.getId())
                .documentId(session.getDocument() != null ? session.getDocument().getId() : null)
                .documentTitle(session.getDocument() != null ? session.getDocument().getTitle() : null)
                .sessionTitle(session.getSessionTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .senderType(message.getSenderType().name())
                .messageContent(message.getMessageContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
