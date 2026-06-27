package com.studyhub.course.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.course.entity.Course;
import com.studyhub.course.dto.CourseResponse;
import com.studyhub.course.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Course Management", description = "Course and subject management APIs")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "List all courses config", description = "Retrieves all course configurations in the system. Accessible by non-admin users.")
    public ResponseEntity<ApiResponse<List<Course>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.ok("Courses retrieved successfully", courseService.getAllCourses()));
    }

    @GetMapping("/popular")
    @Operation(summary = "Get popular courses", description = "Retrieves courses sorted by total document downloads, with file and download counts. Accessible by guest users.")
    public ResponseEntity<List<CourseResponse>> getPopularCourses() {
        return ResponseEntity.ok(courseService.getPopularCourses());
    }
}
