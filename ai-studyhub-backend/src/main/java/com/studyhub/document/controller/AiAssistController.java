package com.studyhub.document.controller;

import com.studyhub.common.enums.DifficultyLevel;
import com.studyhub.document.dto.FlashcardSetResponse;
import com.studyhub.document.dto.QuizResponse;
import com.studyhub.document.entity.DocumentSummary;
import com.studyhub.document.service.AiAssistService;
import com.studyhub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistController {

    private final AiAssistService aiAssistService;

    @PostMapping("/documents/{documentId}/summary")
    public ResponseEntity<DocumentSummary> generateSummary(@PathVariable Long documentId) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateSummary(documentId, email));
    }

    @PostMapping("/documents/{documentId}/quiz")
    public ResponseEntity<QuizResponse> generateQuiz(
            @PathVariable Long documentId,
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") DifficultyLevel difficulty) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateQuiz(documentId, difficulty, email));
    }

    @GetMapping("/documents/{documentId}/quizzes")
    public ResponseEntity<List<QuizResponse>> getQuizzes(@PathVariable Long documentId) {
        return ResponseEntity.ok(aiAssistService.getQuizzesForDocument(documentId));
    }

    @GetMapping("/quizzes/{quizId}")
    public ResponseEntity<QuizResponse> getQuizDetails(@PathVariable Long quizId) {
        return ResponseEntity.ok(aiAssistService.getQuizDetails(quizId));
    }

    @PostMapping("/documents/{documentId}/flashcards")
    public ResponseEntity<FlashcardSetResponse> generateFlashcards(@PathVariable Long documentId) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateFlashcards(documentId, email));
    }

    @GetMapping("/documents/{documentId}/flashcard-sets")
    public ResponseEntity<List<FlashcardSetResponse>> getFlashcardSets(@PathVariable Long documentId) {
        return ResponseEntity.ok(aiAssistService.getFlashcardSetsForDocument(documentId));
    }

    @GetMapping("/flashcards/{setId}")
    public ResponseEntity<FlashcardSetResponse> getFlashcardSetDetails(@PathVariable Long setId) {
        return ResponseEntity.ok(aiAssistService.getFlashcardSetDetails(setId));
    }
}
