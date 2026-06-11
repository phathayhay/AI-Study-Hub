package com.studyhub.document.entity;

import com.studyhub.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_flashcard_sets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiFlashcardSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "set_name", nullable = false, length = 255)
    private String setName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "total_cards", nullable = false)
    @Builder.Default
    private Integer totalCards = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
