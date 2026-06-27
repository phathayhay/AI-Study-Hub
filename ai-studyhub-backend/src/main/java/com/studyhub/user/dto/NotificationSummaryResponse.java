package com.studyhub.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSummaryResponse {
    private long unreadCount;
    private List<NotificationResponse> notifications;
}
