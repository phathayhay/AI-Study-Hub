package com.studyhub.course.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.MajorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/majors")
@RequiredArgsConstructor
@Tag(name = "Major Management Configs", description = "Public configuration APIs for Majors")
public class MajorController {

    private final MajorRepository majorRepository;

    @GetMapping
    @Operation(summary = "Get all majors list", description = "Retrieves all major configurations in the system. Accessible by non-admin users.")
    public ResponseEntity<ApiResponse<List<Major>>> getAllMajors() {
        return ResponseEntity.ok(ApiResponse.ok("Majors retrieved successfully", majorRepository.findAll()));
    }
}
