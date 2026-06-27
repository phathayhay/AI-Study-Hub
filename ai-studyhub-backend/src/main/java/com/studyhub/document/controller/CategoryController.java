package com.studyhub.document.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.document.repository.DocumentCategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category Management Configs", description = "Public configuration APIs for Document Categories")
public class CategoryController {

    private final DocumentCategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Get all document categories", description = "Retrieves all document categories in the system. Accessible by non-admin users.")
    public ResponseEntity<ApiResponse<List<DocumentCategory>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved successfully", categoryRepository.findAll()));
    }
}
