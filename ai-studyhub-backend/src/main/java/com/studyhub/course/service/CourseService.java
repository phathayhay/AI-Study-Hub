package com.studyhub.course.service;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.course.dto.CourseListResponse;
import com.studyhub.course.dto.CourseResponse;
import com.studyhub.course.dto.MajorSummaryResponse;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.CourseRepository;
import com.studyhub.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public List<CourseResponse> getPopularCourses() {
        List<Course> courses = courseRepository.findAll();

        return courses.stream()
                .map(course -> {
                    long filesCount = documentRepository.countByCourseIdAndVisibilityAndModerationStatus(
                            course.getId(), Visibility.PUBLIC, ModerationStatus.APPROVED);
                    long totalDownloads = documentRepository.sumDownloadsByCourseIdAndVisibilityAndModerationStatus(
                            course.getId(), Visibility.PUBLIC, ModerationStatus.APPROVED);

                    return CourseResponse.builder()
                            .id(course.getId())
                            .courseCode(course.getCourseCode())
                            .courseName(course.getCourseName())
                            .description(course.getDescription())
                            .files(filesCount)
                            .downloads(totalDownloads)
                            .build();
                })
                .sorted((c1, c2) -> Long.compare(c2.getDownloads(), c1.getDownloads()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseListResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::toCourseListResponse)
                .collect(Collectors.toList());
    }

    public CourseListResponse toCourseListResponse(Course course) {
        return CourseListResponse.builder()
                .id(course.getId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .description(course.getDescription())
                .isActive(course.getIsActive())
                .major(toMajorSummary(course.getMajor()))
                .majors(course.getMajors().stream()
                        .map(this::toMajorSummary)
                        .collect(Collectors.toList()))
                .build();
    }

    private MajorSummaryResponse toMajorSummary(Major major) {
        if (major == null) {
            return null;
        }
        return MajorSummaryResponse.builder()
                .id(major.getId())
                .majorCode(major.getMajorCode())
                .majorName(major.getMajorName())
                .build();
    }
}
