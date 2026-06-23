package com.studyhub.document.repository;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.document.entity.Document;
import org.springframework.data.jpa.domain.Specification;

public class DocumentSpecifications {

    public static Specification<Document> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    public static Specification<Document> hasMajorId(Long majorId) {
        return (root, query, cb) -> {
            if (majorId == null) {
                return null;
            }
            return cb.equal(root.join("course").join("major").get("id"), majorId);
        };
    }

    public static Specification<Document> hasCourseId(Long courseId) {
        return (root, query, cb) -> {
            if (courseId == null) {
                return null;
            }
            return cb.equal(root.get("course").get("id"), courseId);
        };
    }

    public static Specification<Document> hasCategoryId(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return null;
            }
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    public static Specification<Document> isPublicAndApproved() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("visibility"), Visibility.PUBLIC),
                cb.equal(root.get("moderationStatus"), ModerationStatus.APPROVED)
        );
    }
}
