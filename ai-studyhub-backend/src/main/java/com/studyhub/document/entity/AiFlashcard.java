package com.studyhub.document.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_flashcards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiFlashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private AiFlashcardSet set;

    @Column(name = "front_content", nullable = false, columnDefinition = "TEXT")
    private String frontContent;

    @Column(name = "back_content", nullable = false, columnDefinition = "TEXT")
    private String backContent;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;
}
