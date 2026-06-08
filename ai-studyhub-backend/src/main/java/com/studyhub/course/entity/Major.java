package com.studyhub.course.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "majors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Major {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "major_code", unique = true, nullable = false, length = 20)
    private String majorCode;

    @Column(name = "major_name", nullable = false, length = 100)
    private String majorName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
