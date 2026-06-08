package com.studyhub.document.entity;

import com.studyhub.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_ratings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentRating {

    @EmbeddedId
    private DocumentRatingId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("documentId")
    @JoinColumn(name = "document_id")
    private Document document;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class DocumentRatingId implements Serializable {
        @Column(name = "user_id")
        private Long userId;

        @Column(name = "document_id")
        private Long documentId;
    }
}
