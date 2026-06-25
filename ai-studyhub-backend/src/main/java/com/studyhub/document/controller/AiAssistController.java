package com.studyhub.document.controller;

import com.studyhub.common.enums.DifficultyLevel;
import com.studyhub.document.dto.FlashcardSetResponse;
import com.studyhub.document.dto.QuizResponse;
import com.studyhub.document.entity.DocumentSummary;
import com.studyhub.document.service.AiAssistService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistance", description = "AI-powered academic tools APIs (Summaries, Quizzes, Flashcards)")
public class AiAssistController {

    private final AiAssistService aiAssistService;

    // API yêu cầu AI tóm tắt nội dung tài liệu
    @PostMapping("/documents/{documentId}/summary")
    @Operation(summary = "Generate document summary", description = "Requests Gemini to analyze a document, extracting a short summary, a detailed summary, and key takeaways.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Summary generated successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server or AI API error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Internal server or AI API error\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<DocumentSummary> generateSummary(@PathVariable Long documentId) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateSummary(documentId, email));
    }

    // API lấy tóm tắt của tài liệu nếu đã tồn tại
    @GetMapping("/documents/{documentId}/summary")
    @Operation(summary = "Get existing document summary", description = "Retrieves the pre-generated summary of a document if it exists.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Summary not found for this document", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Summary not found for this document\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<DocumentSummary> getSummary(@PathVariable Long documentId) {
        return ResponseEntity.ok(aiAssistService.getSummaryForDocument(documentId));
    }

    // API yêu cầu AI tạo bộ câu hỏi trắc nghiệm ôn tập
    @PostMapping("/documents/{documentId}/quiz")
    @Operation(summary = "Generate learning quiz", description = "Requests Gemini to automatically generate a multiple-choice questions quiz from a document.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Quiz generated successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server or AI API error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Internal server or AI API error\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<QuizResponse> generateQuiz(
            @PathVariable Long documentId,
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") DifficultyLevel difficulty,
            @RequestParam(value = "quantity", required = false) Integer quantity) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateQuiz(documentId, difficulty, quantity, email));
    }

    // API lấy danh sách các bộ đề trắc nghiệm đã tạo của một tài liệu
    @GetMapping("/documents/{documentId}/quizzes")
    @Operation(summary = "Get document quizzes list", description = "Retrieves all quiz sets generated from a specific document.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Quizzes list retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<List<QuizResponse>> getQuizzes(@PathVariable Long documentId) {
        return ResponseEntity.ok(aiAssistService.getQuizzesForDocument(documentId));
    }

    // API lấy thông tin chi tiết một bộ trắc nghiệm cụ thể
    @GetMapping("/quizzes/{quizId}")
    @Operation(summary = "Get quiz details", description = "Retrieves questions and choices for a specific quiz by its unique ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Quiz details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Quiz not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Quiz not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<QuizResponse> getQuizDetails(@PathVariable Long quizId) {
        return ResponseEntity.ok(aiAssistService.getQuizDetails(quizId));
    }

    // API yêu cầu AI tạo flashcard học tập
    @PostMapping("/documents/{documentId}/flashcards")
    @Operation(summary = "Generate learning flashcards", description = "Requests Gemini to automatically extract key terms and definitions to generate flashcard sets from a document.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Flashcards generated successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server or AI API error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Internal server or AI API error\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<FlashcardSetResponse> generateFlashcards(@PathVariable Long documentId) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(aiAssistService.generateFlashcards(documentId, email));
    }

    // API lấy danh sách các bộ flashcard đã tạo của một tài liệu
    @GetMapping("/documents/{documentId}/flashcard-sets")
    @Operation(summary = "Get document flashcard sets list", description = "Retrieves all flashcard sets generated from a specific document.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Flashcard sets list retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<List<FlashcardSetResponse>> getFlashcardSets(@PathVariable Long documentId) {
        return ResponseEntity.ok(aiAssistService.getFlashcardSetsForDocument(documentId));
    }

    // API lấy thông tin chi tiết một bộ flashcard cụ thể
    @GetMapping("/flashcards/{setId}")
    @Operation(summary = "Get flashcard set details", description = "Retrieves cards and terms for a specific flashcard set by its unique ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Flashcard set details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Flashcard set not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Flashcard set not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<FlashcardSetResponse> getFlashcardSetDetails(@PathVariable Long setId) {
        return ResponseEntity.ok(aiAssistService.getFlashcardSetDetails(setId));
    }
}

