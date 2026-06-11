package com.studyhub.document.entity;

import com.studyhub.common.enums.SharePermission;
import com.studyhub.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_shares", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "shared_user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_user_id", nullable = false)
    private User sharedUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    @Builder.Default
    private SharePermission permission = SharePermission.VIEW;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
