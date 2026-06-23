package com.studyhub.course.service;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.course.dto.CourseResponse;
import com.studyhub.course.entity.Course;
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
}
