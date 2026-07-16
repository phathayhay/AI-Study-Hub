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
import com.studyhub.user.service.UserQuotaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private TextExtractionService textExtractionService;

    @Mock
    private AiModelService aiModelService;

    @Mock
    private UserQuotaService userQuotaService;

    @InjectMocks
    private ChatService chatService;

    private User mockUser;
    private Document mockDocument;
    private ChatSession mockSession;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .email("test@fpt.edu.vn")
                .firstName("User")
                .lastName("Test")
                .build();

        mockDocument = Document.builder()
                .id(100L)
                .title("FPT Java Document")
                .fileUrl("https://cloudinary.com/doc.pdf")
                .build();

        mockSession = ChatSession.builder()
                .id(200L)
                .user(mockUser)
                .sessionTitle("Cuộc trò chuyện mới")
                .build();
    }

    @Test
    void testCreateSession_WithoutDocument() {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .sessionTitle("Direct Chat")
                .build();

        when(userRepository.findByEmail("test@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(invocation -> {
            ChatSession saved = invocation.getArgument(0);
            saved.setId(300L);
            return saved;
        });

        ChatSessionResponse response = chatService.createSession(request, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(300L, response.getId());
        assertEquals("Direct Chat", response.getSessionTitle());
        assertNull(response.getDocumentId());
    }

    @Test
    void testCreateSession_WithDocument() {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .documentId(100L)
                .build();

        when(userRepository.findByEmail("test@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(documentRepository.findById(100L)).thenReturn(Optional.of(mockDocument));
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(invocation -> {
            ChatSession saved = invocation.getArgument(0);
            saved.setId(301L);
            return saved;
        });

        ChatSessionResponse response = chatService.createSession(request, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(301L, response.getId());
        assertEquals("Trò chuyện về: FPT Java Document", response.getSessionTitle());
        assertEquals(100L, response.getDocumentId());
    }

    @Test
    void testCreateSession_UserNotFound() {
        CreateSessionRequest request = new CreateSessionRequest();
        when(userRepository.findByEmail("unknown@fpt.edu.vn")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            chatService.createSession(request, "unknown@fpt.edu.vn");
        });
    }

    @Test
    void testGetUserSessions() {
        when(chatSessionRepository.findByUser_EmailOrderByUpdatedAtDesc("test@fpt.edu.vn"))
                .thenReturn(List.of(mockSession));

        List<ChatSessionResponse> response = chatService.getUserSessions("test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Cuộc trò chuyện mới", response.get(0).getSessionTitle());
    }

    @Test
    void testGetSessionMessages_Success() {
        when(chatSessionRepository.findByIdAndUser_Email(200L, "test@fpt.edu.vn"))
                .thenReturn(Optional.of(mockSession));

        ChatMessage message = ChatMessage.builder()
                .id(500L)
                .session(mockSession)
                .senderType(SenderType.USER)
                .messageContent("Hello AI")
                .build();

        when(chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(200L))
                .thenReturn(List.of(message));

        List<ChatMessageResponse> response = chatService.getSessionMessages(200L, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Hello AI", response.get(0).getMessageContent());
        assertEquals("USER", response.get(0).getSenderType());
    }

    @Test
    void testGetSessionMessages_AccessDenied() {
        when(chatSessionRepository.findByIdAndUser_Email(200L, "unauthorized@fpt.edu.vn"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            chatService.getSessionMessages(200L, "unauthorized@fpt.edu.vn");
        });
    }

    @Test
    void testSendMessage_Success() {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("What is Java?")
                .build();

        when(chatSessionRepository.findByIdAndUser_Email(200L, "test@fpt.edu.vn"))
                .thenReturn(Optional.of(mockSession));

        // Stub user message save
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(new Random().nextLong(1000) + 1000);
            return msg;
        });

        // Chat message history includes the saved user message
        ChatMessage userMsg = ChatMessage.builder()
                .id(1001L)
                .session(mockSession)
                .senderType(SenderType.USER)
                .messageContent("What is Java?")
                .build();
        when(chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(200L))
                .thenReturn(List.of(userMsg));

        // AI mock response
        AiModelService.AiResponse mockGeminiResp = new AiModelService.AiResponse(
                "Java is a popular programming language.",
                "gemini-2.5-flash-lite",
                200
        );
        when(aiModelService.chat(anyString(), anyList(), eq("What is Java?")))
                .thenReturn(mockGeminiResp);

        ChatMessageResponse response = chatService.sendMessage(200L, request, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals("Java is a popular programming language.", response.getMessageContent());
        verify(chatSessionRepository, times(1)).save(mockSession);
    }

    @Test
    void testSendMessage_WithDocumentContext() throws Exception {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Summarize this document")
                .build();

        ChatSession sessionWithDoc = ChatSession.builder()
                .id(201L)
                .user(mockUser)
                .document(mockDocument)
                .sessionTitle("Trò chuyện về tài liệu")
                .build();

        when(chatSessionRepository.findByIdAndUser_Email(201L, "test@fpt.edu.vn"))
                .thenReturn(Optional.of(sessionWithDoc));

        when(textExtractionService.extractTextFromUrl(mockDocument.getFileUrl()))
                .thenReturn("This is FPT rules document content.");

        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(2002L);
            return msg;
        });

        ChatMessage userMsg = ChatMessage.builder()
                .id(2002L)
                .session(sessionWithDoc)
                .senderType(SenderType.USER)
                .messageContent("Summarize this document")
                .build();
        when(chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(201L))
                .thenReturn(List.of(userMsg));

        AiModelService.AiResponse mockGeminiResp = new AiModelService.AiResponse(
                "Document summary text",
                "gemini-2.5-flash-lite",
                120
        );
        when(aiModelService.chat(
                contains("This is FPT rules document content."),
                anyList(),
                eq("Summarize this document")
        )).thenReturn(mockGeminiResp);

        ChatMessageResponse response = chatService.sendMessage(201L, request, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals("Document summary text", response.getMessageContent());
    }

    @Test
    void testSendMessage_TextExtractionFailure() throws Exception {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Summarize this document")
                .build();

        ChatSession sessionWithDoc = ChatSession.builder()
                .id(201L)
                .user(mockUser)
                .document(mockDocument)
                .sessionTitle("Trò chuyện về tài liệu")
                .build();

        when(chatSessionRepository.findByIdAndUser_Email(201L, "test@fpt.edu.vn"))
                .thenReturn(Optional.of(sessionWithDoc));

        // Simulate extraction failure
        when(textExtractionService.extractTextFromUrl(mockDocument.getFileUrl()))
                .thenThrow(new RuntimeException("Could not download file"));

        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(2003L);
            return msg;
        });

        ChatMessage userMsg = ChatMessage.builder()
                .id(2003L)
                .session(sessionWithDoc)
                .senderType(SenderType.USER)
                .messageContent("Summarize this document")
                .build();
        when(chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(201L))
                .thenReturn(List.of(userMsg));

        AiModelService.AiResponse mockGeminiResp = new AiModelService.AiResponse(
                "Fallback response",
                "gemini-2.5-flash-lite",
                50
        );
        // Should fall back to the default English academic tutoring prompt.
        when(aiModelService.chat(
                contains("Always answer in clear, accurate English"),
                anyList(),
                eq("Summarize this document")
        )).thenReturn(mockGeminiResp);

        ChatMessageResponse response = chatService.sendMessage(201L, request, "test@fpt.edu.vn");

        assertNotNull(response);
        assertEquals("Fallback response", response.getMessageContent());
    }
}
