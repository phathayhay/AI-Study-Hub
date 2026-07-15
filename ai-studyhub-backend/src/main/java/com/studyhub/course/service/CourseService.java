package com.studyhub.course.service;

import com.studyhub.admin.dto.CourseRequest;
import com.studyhub.admin.dto.MajorRequest;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.course.dto.CourseListResponse;
import com.studyhub.course.dto.CourseResponse;
import com.studyhub.course.dto.MajorSummaryResponse;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.CourseRepository;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final DocumentRepository documentRepository;
    private final MajorRepository majorRepository;

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

    // ── Majors CRUD ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Major> getAllMajors() {
        return majorRepository.findAll();
    }

    @Transactional
    public Major createMajor(MajorRequest request) {
        if (majorRepository.findByMajorCode(request.getMajorCode().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Major code already exists");
        }
        Major major = Major.builder()
                .majorCode(request.getMajorCode().toUpperCase())
                .majorName(request.getMajorName())
                .description(request.getDescription())
                .build();
        return majorRepository.save(major);
    }

    @Transactional
    public Major updateMajor(Long id, MajorRequest request) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Major not found"));
        major.setMajorName(request.getMajorName());
        major.setDescription(request.getDescription());
        return majorRepository.save(major);
    }

    @Transactional
    public void deleteMajor(Long id) {
        if (!majorRepository.existsById(id)) {
            throw new IllegalArgumentException("Major not found");
        }
        majorRepository.deleteById(id);
    }

    // ── Courses CRUD ────────────────────────────────────────────────────────

    @Transactional
    public CourseListResponse createCourse(CourseRequest request) {
        List<Major> selectedMajors = resolveCourseMajors(request);
        Major primaryMajor = selectedMajors.get(0);
        Course course = Course.builder()
                .courseCode(request.getCourseCode().toUpperCase())
                .courseName(request.getCourseName())
                .description(request.getDescription())
                .major(primaryMajor)
                .majors(new LinkedHashSet<>(selectedMajors))
                .isActive(request.getIsActive())
                .build();
        return toCourseListResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseListResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        List<Major> selectedMajors = resolveCourseMajors(request);

        course.setCourseName(request.getCourseName());
        course.setDescription(request.getDescription());
        course.setMajor(selectedMajors.get(0));
        course.setMajors(new LinkedHashSet<>(selectedMajors));
        course.setIsActive(request.getIsActive());
        return toCourseListResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Course not found");
        }
        courseRepository.deleteById(id);
    }

    private List<Major> resolveCourseMajors(CourseRequest request) {
        LinkedHashSet<Long> majorIds = new LinkedHashSet<>();
        if (request.getMajorIds() != null) {
            request.getMajorIds().stream()
                    .filter(Objects::nonNull)
                    .forEach(majorIds::add);
        }
        if (request.getMajorId() != null) {
            majorIds.add(request.getMajorId());
        }
        if (majorIds.isEmpty()) {
            throw new IllegalArgumentException("At least one major must be selected");
        }

        List<Major> selectedMajors = new ArrayList<>();
        for (Long majorId : majorIds) {
            Major major = majorRepository.findById(majorId)
                    .orElseThrow(() -> new IllegalArgumentException("Major not found"));
            selectedMajors.add(major);
        }
        return selectedMajors;
    }
}
