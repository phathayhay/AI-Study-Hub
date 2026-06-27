package com.studyhub.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardAnalyticsResponse {
    private List<AdminUserResponse> recentUsers;
    private List<AdminActivityItemResponse> activities;
    private List<AdminAnalyticsPointResponse> uploadTrends;
    private List<AdminAnalyticsPointResponse> downloadTrends;
    private List<AdminAnalyticsPointResponse> documentDistribution;
    private List<AdminAnalyticsPointResponse> activeUsersByDay;
    private List<AdminAnalyticsPointResponse> aiChatUsage24h;
}
