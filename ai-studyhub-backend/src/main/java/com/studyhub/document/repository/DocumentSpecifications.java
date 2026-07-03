package com.studyhub.document.repository;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.Folder;
import com.studyhub.course.entity.Course;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class DocumentSpecifications {

    public static Specification<Document> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            
            // Use LEFT joins so that documents without courses/categories/uploaders are not excluded
            Join<Document, Course> courseJoin = root.join("course", JoinType.LEFT);
            Join<Document, DocumentCategory> categoryJoin = root.join("category", JoinType.LEFT);
            Join<Document, User> userJoin = root.join("user", JoinType.LEFT);
            
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(courseJoin.get("courseCode")), pattern),
                    cb.like(cb.lower(courseJoin.get("courseName")), pattern),
                    cb.like(cb.lower(categoryJoin.get("categoryName")), pattern),
                    cb.like(cb.lower(userJoin.get("firstName")), pattern),
                    cb.like(cb.lower(userJoin.get("lastName")), pattern)
            );
        };
    }

    public static Specification<Document> hasMajorId(Long majorId) {
        return (root, query, cb) -> {
            if (majorId == null) {
                return null;
            }
            query.distinct(true);
            Join<Document, Course> courseJoin = root.join("course", JoinType.LEFT);
            return cb.or(
                    cb.equal(courseJoin.join("major", JoinType.LEFT).get("id"), majorId),
                    cb.equal(courseJoin.join("majors", JoinType.LEFT).get("id"), majorId)
            );
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
        return (root, query, cb) -> {
            Join<Document, Folder> folderJoin = root.join("folder", JoinType.LEFT);
            return cb.and(
                    cb.equal(root.get("visibility"), Visibility.PUBLIC),
                    cb.equal(root.get("moderationStatus"), ModerationStatus.APPROVED),
                    cb.or(
                            cb.isNull(root.get("folder")),
                            cb.notEqual(folderJoin.get("visibility"), Visibility.PUBLIC)
                    )
            );
        };
    }
}
