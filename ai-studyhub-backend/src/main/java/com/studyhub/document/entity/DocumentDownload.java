package com.studyhub.document.entity;

import com.studyhub.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_downloads")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentDownload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "downloaded_at", updatable = false)
    private LocalDateTime downloadedAt;

    @PrePersist
    protected void onCreate() {
        downloadedAt = LocalDateTime.now();
    }
}
