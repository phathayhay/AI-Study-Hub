package com.studyhub.admin.service;

import com.studyhub.admin.dto.AdminDashboardAnalyticsResponse;
import com.studyhub.admin.dto.AdminActivityLogResponse;
import com.studyhub.common.PageResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

public interface AdminAnalyticsService {
    /**
     * Build and retrieve current dashboard analytics point series and summaries.
     *
     * @return AdminDashboardAnalyticsResponse
     */
    AdminDashboardAnalyticsResponse getDashboardAnalytics();

    /**
     * Fetch paginated and filtered activity logs.
     *
     * @param query    general search term
     * @param type     type filter (user, document, etc.)
     * @param dateFrom start range
     * @param dateTo   end range
     * @param page     page number
     * @param size     page size
     * @return PageResponse containing activity log rows
     */
    PageResponse<AdminActivityLogResponse> getActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    );

    /**
     * Generate activity logs in CSV format wrapped in a ByteArrayResource.
     *
     * @param query    general search term
     * @param type     type filter
     * @param dateFrom start range
     * @param dateTo   end range
     * @return CSV response stream
     */
    ResponseEntity<ByteArrayResource> exportActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    );
}
