package com.studyhub.document.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_name", unique = true, nullable = false, length = 100)
    private String categoryName;
}
