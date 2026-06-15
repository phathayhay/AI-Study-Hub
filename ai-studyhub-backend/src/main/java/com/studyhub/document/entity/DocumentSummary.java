package com.studyhub.document.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "document_summaries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    @com.fasterxml.jackson.annotation.JsonProperty("documentId")
    public Long getDocumentId() {
        return document != null ? document.getId() : null;
    }

    @Column(name = "short_summary", nullable = false, length = 1000)
    private String shortSummary;

    @Column(name = "long_summary", nullable = false, columnDefinition = "LONGTEXT")
    private String longSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_takeaways", nullable = false)
    private List<String> keyTakeaways;

    @Column(name = "tokens_used")
    @Builder.Default
    private Integer tokensUsed = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
