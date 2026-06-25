package com.studyhub.document.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyhub.chat.service.GeminiApiService;
import com.studyhub.common.enums.CorrectOption;
import com.studyhub.common.enums.DifficultyLevel;
import com.studyhub.document.dto.*;
import com.studyhub.document.entity.*;
import com.studyhub.document.repository.*;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
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
    private final TextExtractionService textExtractionService;
    private final GeminiApiService geminiApiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public DocumentSummary generateSummary(Long documentId, String userEmail) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Check if summary already exists
        var existing = summaryRepository.findByDocument_Id(documentId);
        if (existing.isPresent()) {
            log.info("Summary already exists for document: {}", documentId);
            return existing.get();
        }

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        // Limit context size to avoid token limit errors (e.g. approx 15k characters)
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        String prompt = "Hãy tóm tắt tài liệu sau đây bằng Tiếng Việt. Trả về định dạng JSON có cấu trúc chính xác như sau:\n" +
                "{\n" +
                "  \"shortSummary\": \"Tóm tắt ngắn gọn (dưới 1000 ký tự)\",\n" +
                "  \"longSummary\": \"Tóm tắt chi tiết các phần quan trọng\",\n" +
                "  \"keyTakeaways\": [\"Ý chính 1\", \"Ý chính 2\", ...]\n" +
                "}\n" +
                "Nội dung tài liệu:\n\n" + contentToProcess;

        log.info("Requesting Gemini to generate summary for document: {}", documentId);
        GeminiApiService.GeminiResponse response = geminiApiService.chat(
                "Bạn là trợ lý học tập AI chuyên tóm tắt tài liệu học thuật.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        SummaryJsonDto summaryDto = objectMapper.readValue(jsonText, SummaryJsonDto.class);

        DocumentSummary summary = DocumentSummary.builder()
                .document(doc)
                .shortSummary(summaryDto.getShortSummary())
                .longSummary(summaryDto.getLongSummary())
                .keyTakeaways(summaryDto.getKeyTakeaways())
                .tokensUsed(response.tokensUsed())
                .build();

        return summaryRepository.save(summary);
    }

    @Transactional(readOnly = true)
    public DocumentSummary getSummaryForDocument(Long documentId) {
        return summaryRepository.findByDocument_Id(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found for this document"));
    }

    @Transactional
    public QuizResponse generateQuiz(Long documentId, DifficultyLevel difficulty, Integer quantity, String userEmail) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        int numQuestions = (quantity != null && quantity > 0) ? quantity : 5;
        String prompt = String.format(
                "Hãy tạo một bộ câu hỏi trắc nghiệm ôn tập gồm đúng %d câu hỏi, mức độ %s dựa trên tài liệu sau đây bằng Tiếng Việt. " +
                        "Trả về định dạng JSON có cấu trúc chính xác như sau:\n" +
                        "{\n" +
                        "  \"quizTitle\": \"Tiêu đề bộ đề trắc nghiệm\",\n" +
                        "  \"questions\": [\n" +
                        "    {\n" +
                        "      \"questionText\": \"Câu hỏi?\",\n" +
                        "      \"optionA\": \"Lựa chọn A\",\n" +
                        "      \"optionB\": \"Lựa chọn B\",\n" +
                        "      \"optionC\": \"Lựa chọn C\",\n" +
                        "      \"optionD\": \"Lựa chọn D\",\n" +
                        "      \"correctOption\": \"A\",\n" +
                        "      \"explanation\": \"Giải thích tại sao lựa chọn đó đúng\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}\n" +
                        "Chú ý: correctOption chỉ được nhận một trong bốn giá trị: A, B, C, D.\n" +
                        "Nội dung tài liệu:\n\n%s",
                numQuestions, difficulty.name(), contentToProcess
        );

        log.info("Requesting Gemini to generate quiz for document: {}", documentId);
        GeminiApiService.GeminiResponse response = geminiApiService.chat(
                "Bạn là trợ lý học tập AI chuyên tạo câu hỏi trắc nghiệm ôn tập.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        QuizJsonDto quizDto = objectMapper.readValue(jsonText, QuizJsonDto.class);

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

        // Extract Text
        String text = textExtractionService.extractTextFromUrl(doc.getFileUrl());
        String contentToProcess = text.substring(0, Math.min(text.length(), 15000));

        String prompt = "Hãy tạo một bộ thẻ ghi nhớ học tập (flashcards) gồm 8 đến 15 thẻ dựa trên tài liệu sau bằng Tiếng Việt. " +
                "Trả về định dạng JSON có cấu trúc chính xác như sau:\n" +
                "{\n" +
                "  \"setName\": \"Tên bộ flashcards\",\n" +
                "  \"description\": \"Mô tả ngắn gọn\",\n" +
                "  \"cards\": [\n" +
                "    {\n" +
                "      \"frontContent\": \"Khái niệm / Câu hỏi (Mặt trước)\",\n" +
                "      \"backContent\": \"Định nghĩa / Giải thích (Mặt sau)\"\n" +
                "    }\n" +
                "  ]\n" +
                "}\n" +
                "Nội dung tài liệu:\n\n" + contentToProcess;

        log.info("Requesting Gemini to generate flashcards for document: {}", documentId);
        GeminiApiService.GeminiResponse response = geminiApiService.chat(
                "Bạn là trợ lý học tập AI chuyên tạo flashcards giúp ghi nhớ kiến thức.",
                Collections.emptyList(),
                prompt
        );

        String jsonText = cleanJsonText(response.text());
        FlashcardSetJsonDto setDto = objectMapper.readValue(jsonText, FlashcardSetJsonDto.class);

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
        if (firstBrace != -1 && lastBrace != -1 && firstBrace < lastBrace) {
            return text.substring(firstBrace, lastBrace + 1);
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
