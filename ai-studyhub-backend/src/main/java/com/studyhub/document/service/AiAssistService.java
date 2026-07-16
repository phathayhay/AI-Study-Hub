package com.studyhub.document.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyhub.chat.service.AiModelService;
import com.studyhub.common.enums.CorrectOption;
import com.studyhub.common.enums.DifficultyLevel;
import com.studyhub.document.dto.*;
import com.studyhub.document.entity.*;
import com.studyhub.document.repository.*;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.ActivityLog;
import com.studyhub.user.repository.ActivityLogRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.UserQuotaService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistService {

    private final DocumentRepository documentRepository;
    private final DocumentSummaryRepository summaryRepository;
    private final AiQuizRepository quizRepository;
    private final AiQuizQuestionRepository quizQuestionRepository;
    private final AiFlashcardSetRepository flashcardSetRepository;
    private final AiFlashcardRepository flashcardRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserQuotaService userQuotaService;
    private final TextExtractionService textExtractionService;
    private final AiModelService aiModelService;
    private final ObjectMapper objectMapper;

    @Transactional
    public DocumentSummary generateSummary(Long documentId, String userEmail) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userQuotaService.validateAiRequestAllowed(user);

        var existing = summaryRepository.findByDocument_Id(documentId);

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        // Limit context size to avoid token limit errors (e.g. approx 15k characters)
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        String prompt = "REQUIRED: Write all user-facing content in English, regardless of the source document language. " +
                "Return a JSON object that exactly matches this structure. Do not rename any keys:\n" +
                "{\n" +
                "  \"shortSummary\": \"A concise summary under 1000 characters\",\n" +
                "  \"longSummary\": \"A detailed summary of the important sections\",\n" +
                "  \"keyTakeaways\": [\"Key takeaway 1\", \"Key takeaway 2\"]\n" +
                "}\n" +
                "Source study document:\n\n" + contentToProcess;

        log.info("Requesting AI to generate summary for document: {}", documentId);
        AiModelService.AiResponse response = aiModelService.chat(
                "You are an AI study assistant specializing in academic summaries. Always respond in English.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        log.info("generateSummary raw response: {}", response.text());
        log.info("generateSummary cleaned JSON: {}", jsonText);
        SummaryJsonDto summaryDto = objectMapper.readValue(jsonText, SummaryJsonDto.class);

        if (summaryDto == null || summaryDto.getShortSummary() == null || summaryDto.getLongSummary() == null) {
            throw new IllegalArgumentException("Không thể trích xuất tóm tắt hợp lệ từ AI. Vui lòng thử lại.");
        }

        DocumentSummary summary = existing.orElseGet(() -> DocumentSummary.builder().document(doc).build());
        summary.setShortSummary(summaryDto.getShortSummary());
        summary.setLongSummary(summaryDto.getLongSummary());
        summary.setKeyTakeaways(summaryDto.getKeyTakeaways());
        summary.setTokensUsed(response.tokensUsed());

        DocumentSummary savedSummary = summaryRepository.save(summary);
        recordAiUsage(user, "AI_SUMMARY", "DOCUMENT", documentId);
        return savedSummary;
    }

    @Transactional(readOnly = true)
    public DocumentSummary getSummaryForDocument(Long documentId) {
        return summaryRepository.findByDocument_Id(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found for this document"));
    }

    @Transactional
    public QuizResponse generateQuiz(Long documentId, DifficultyLevel difficulty, String userEmail) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userQuotaService.validateAiRequestAllowed(user);

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        String prompt = String.format(
                "REQUIRED: Create 5 to 10 %s-level multiple-choice review questions from the document. " +
                        "Write the title, questions, options, and explanations in English, regardless of the source language.\n" +
                        "Return a JSON object that exactly matches this structure. Do not rename any keys:\n" +
                        "{\n" +
                        "  \"quizTitle\": \"Quiz title\",\n" +
                        "  \"questions\": [\n" +
                        "    {\n" +
                        "      \"questionText\": \"Question?\",\n" +
                        "      \"optionA\": \"Option A\",\n" +
                        "      \"optionB\": \"Option B\",\n" +
                        "      \"optionC\": \"Option C\",\n" +
                        "      \"optionD\": \"Option D\",\n" +
                        "      \"correctOption\": \"A\",\n" +
                        "      \"explanation\": \"Why this option is correct\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}\n" +
                        "correctOption must be one of: A, B, C, D.\n" +
                        "Source study document:\n\n%s",
                difficulty.name(), contentToProcess
        );

        log.info("Requesting AI to generate quiz for document: {}", documentId);
        AiModelService.AiResponse response = aiModelService.chat(
                "You are an AI study assistant specializing in multiple-choice quizzes. Always respond in English.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        log.info("generateQuiz raw response: {}", response.text());
        log.info("generateQuiz cleaned JSON: {}", jsonText);
        QuizJsonDto quizDto = objectMapper.readValue(jsonText, QuizJsonDto.class);

        if (quizDto == null || quizDto.getQuestions() == null || quizDto.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("Không thể trích xuất câu hỏi trắc nghiệm hợp lệ từ AI. Vui lòng thử lại.");
        }

        AiQuiz quiz = AiQuiz.builder()
                .document(doc)
                .user(user)
                .quizTitle(quizDto.getQuizTitle())
                .totalQuestions(quizDto.getQuestions().size())
                .difficultyLevel(difficulty)
                .build();

        AiQuiz savedQuiz = quizRepository.save(quiz);

        List<AiQuizQuestion> questions = new ArrayList<>();
        int order = 1;
        for (QuizQuestionJsonDto qDto : quizDto.getQuestions()) {
            CorrectOption correctOption;
            try {
                correctOption = CorrectOption.valueOf(qDto.getCorrectOption().trim().toUpperCase());
            } catch (Exception e) {
                correctOption = CorrectOption.A; // Fallback
            }

            AiQuizQuestion question = AiQuizQuestion.builder()
                    .quiz(savedQuiz)
                    .questionText(qDto.getQuestionText())
                    .optionA(qDto.getOptionA())
                    .optionB(qDto.getOptionB())
                    .optionC(qDto.getOptionC())
                    .optionD(qDto.getOptionD())
                    .correctOption(correctOption)
                    .explanation(qDto.getExplanation())
                    .sortOrder(order++)
                    .build();
            questions.add(quizQuestionRepository.save(question));
        }

        recordAiUsage(user, "AI_QUIZ", "QUIZ", savedQuiz.getId());
        return mapQuizToResponse(savedQuiz, questions);
    }

    @Transactional(readOnly = true)
    public List<QuizResponse> getQuizzesForDocument(Long documentId) {
        return quizRepository.findByDocumentId(documentId).stream()
                .map(quiz -> {
                    List<AiQuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quiz.getId());
                    return mapQuizToResponse(quiz, questions);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuizDetails(Long quizId) {
        AiQuiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        List<AiQuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quizId);
        return mapQuizToResponse(quiz, questions);
    }

    @Transactional
    public FlashcardSetResponse generateFlashcards(Long documentId, String userEmail) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userQuotaService.validateAiRequestAllowed(user);

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        String prompt = "REQUIRED: Create 8 to 15 study flashcards from the document. " +
                "Write the set name, description, questions, and answers in English, regardless of the source language.\n" +
                "Return a JSON object that exactly matches this structure. Do not rename any keys:\n" +
                "{\n" +
                "  \"setName\": \"Flashcard set name\",\n" +
                "  \"description\": \"Brief description\",\n" +
                "  \"cards\": [\n" +
                "    {\n" +
                "      \"frontContent\": \"Concept or question\",\n" +
                "      \"backContent\": \"Definition or explanation\"\n" +
                "    }\n" +
                "  ]\n" +
                "}\n" +
                "Source study document:\n\n" + contentToProcess;

        log.info("Requesting AI to generate flashcards for document: {}", documentId);
        AiModelService.AiResponse response = aiModelService.chat(
                "You are an AI study assistant specializing in effective study flashcards. Always respond in English.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        log.info("generateFlashcards raw response: {}", response.text());
        log.info("generateFlashcards cleaned JSON: {}", jsonText);
        FlashcardSetJsonDto setDto = objectMapper.readValue(jsonText, FlashcardSetJsonDto.class);

        if (setDto == null || setDto.getCards() == null || setDto.getCards().isEmpty()) {
            throw new IllegalArgumentException("Không thể trích xuất bộ thẻ ghi nhớ hợp lệ từ AI. Vui lòng thử lại.");
        }

        AiFlashcardSet cardSet = AiFlashcardSet.builder()
                .document(doc)
                .user(user)
                .setName(setDto.getSetName())
                .description(setDto.getDescription())
                .totalCards(setDto.getCards().size())
                .build();

        AiFlashcardSet savedSet = flashcardSetRepository.save(cardSet);

        List<AiFlashcard> cards = new ArrayList<>();
        int order = 1;
        for (FlashcardJsonDto cDto : setDto.getCards()) {
            AiFlashcard card = AiFlashcard.builder()
                    .set(savedSet)
                    .frontContent(cDto.getFrontContent())
                    .backContent(cDto.getBackContent())
                    .sortOrder(order++)
                    .build();
            cards.add(flashcardRepository.save(card));
        }

        recordAiUsage(user, "AI_FLASHCARDS", "FLASHCARD_SET", savedSet.getId());
        return mapFlashcardSetToResponse(savedSet, cards);
    }

    @Transactional(readOnly = true)
    public List<FlashcardSetResponse> getFlashcardSetsForDocument(Long documentId) {
        return flashcardSetRepository.findByDocumentId(documentId).stream()
                .map(set -> {
                    List<AiFlashcard> cards = flashcardRepository.findBySetIdOrderBySortOrderAsc(set.getId());
                    return mapFlashcardSetToResponse(set, cards);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FlashcardSetResponse getFlashcardSetDetails(Long setId) {
        AiFlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard set not found"));
        List<AiFlashcard> cards = flashcardRepository.findBySetIdOrderBySortOrderAsc(setId);
        return mapFlashcardSetToResponse(set, cards);
    }

    private String cleanJsonText(String text) {
        if (text == null) return "{}";
        text = text.trim();

        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        int firstBracket = text.indexOf('[');
        int lastBracket = text.lastIndexOf(']');

        int start = -1;
        int end = -1;

        if (firstBrace != -1 && lastBrace != -1) {
            start = firstBrace;
            end = lastBrace + 1;
        }

        if (firstBracket != -1 && lastBracket != -1) {
            if (start == -1 || firstBracket < start) {
                start = firstBracket;
                end = lastBracket + 1;
            }
        }

        if (start != -1 && end != -1 && start < end) {
            return text.substring(start, end);
        }
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        return text.trim();
    }

    private void recordAiUsage(User user, String actionType, String entityType, Long entityId) {
        activityLogRepository.save(ActivityLog.builder()
                .user(user)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .description("Successful AI request")
                .build());
    }

    private QuizResponse mapQuizToResponse(AiQuiz quiz, List<AiQuizQuestion> questions) {
        List<QuizQuestionDto> qDtos = questions.stream()
                .map(q -> QuizQuestionDto.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctOption(q.getCorrectOption().name())
                        .explanation(q.getExplanation())
                        .sortOrder(q.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .documentId(quiz.getDocument().getId())
                .userId(quiz.getUser().getId())
                .quizTitle(quiz.getQuizTitle())
                .totalQuestions(quiz.getTotalQuestions())
                .difficultyLevel(quiz.getDifficultyLevel().name())
                .createdAt(quiz.getCreatedAt())
                .questions(qDtos)
                .build();
    }

    private FlashcardSetResponse mapFlashcardSetToResponse(AiFlashcardSet set, List<AiFlashcard> cards) {
        List<FlashcardDto> cDtos = cards.stream()
                .map(c -> FlashcardDto.builder()
                        .id(c.getId())
                        .frontContent(c.getFrontContent())
                        .backContent(c.getBackContent())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return FlashcardSetResponse.builder()
                .id(set.getId())
                .documentId(set.getDocument().getId())
                .userId(set.getUser().getId())
                .setName(set.getSetName())
                .description(set.getDescription())
                .totalCards(set.getTotalCards())
                .createdAt(set.getCreatedAt())
                .cards(cDtos)
                .build();
    }

    @Data
    public static class SummaryJsonDto {
        private String shortSummary;
        private String longSummary;
        private List<String> keyTakeaways;
    }

    @Data
    public static class QuizQuestionJsonDto {
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;
        private String explanation;
    }

    @Data
    public static class QuizJsonDto {
        private String quizTitle;
        private List<QuizQuestionJsonDto> questions;
    }

    @Data
    public static class FlashcardJsonDto {
        private String frontContent;
        private String backContent;
    }

    @Data
    public static class FlashcardSetJsonDto {
        private String setName;
        private String description;
        private List<FlashcardJsonDto> cards;
    }
}
