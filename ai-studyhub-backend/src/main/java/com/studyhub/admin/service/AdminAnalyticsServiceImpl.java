package com.studyhub.admin.service;

import com.studyhub.admin.dto.*;
import com.studyhub.common.PageResponse;
import com.studyhub.chat.entity.ChatMessage;
import com.studyhub.chat.entity.ChatSession;
import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.chat.repository.ChatSessionRepository;
import com.studyhub.common.enums.SenderType;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentDownload;
import com.studyhub.document.entity.DocumentView;
import com.studyhub.document.entity.Report;
import com.studyhub.document.repository.DocumentDownloadRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.DocumentViewRepository;
import com.studyhub.document.repository.ReportRepository;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ReportRepository reportRepository;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final DocumentViewRepository documentViewRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;

    private static final DateTimeFormatter DAY_LABEL_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HOUR_LABEL_FORMATTER = DateTimeFormatter.ofPattern("HH:00");
    private static final DateTimeFormatter CSV_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardAnalyticsResponse getDashboardAnalytics() {
        log.info("Admin: Building dashboard analytics");

        List<User> users = userRepository.findAll();
        List<Document> documents = documentRepository.findAll();
        List<Report> reports = reportRepository.findAll();
        List<DocumentDownload> downloads = documentDownloadRepository.findAll();
        List<DocumentView> views = documentViewRepository.findAll();
        List<ChatMessage> chatMessages = chatMessageRepository.findAll();
        List<ChatSession> chatSessions = chatSessionRepository.findAll();

        return AdminDashboardAnalyticsResponse.builder()
                .recentUsers(users.stream()
                        .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                        .limit(3)
                        .map(this::mapUserResponse)
                        .collect(Collectors.toList()))
                .activities(buildRecentActivities(users, documents, reports, chatSessions))
                .uploadTrends(buildDailyCountSeriesFromDocuments(documents, 7))
                .downloadTrends(buildDailyCountSeriesFromDownloads(downloads, 7))
                .documentDistribution(buildDocumentDistribution(documents))
                .activeUsersByDay(buildActiveUsersByDay(documents, downloads, views, chatSessions, 7))
                .aiChatUsage24h(buildAiChatUsage(chatMessages))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminActivityLogResponse> getActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        List<AdminActivityLogResponse> allLogs = buildFilteredActivityLogs(query, type, dateFrom, dateTo);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, allLogs.size());
        int toIndex = Math.min(fromIndex + safeSize, allLogs.size());
        List<AdminActivityLogResponse> content = fromIndex >= toIndex
                ? Collections.emptyList()
                : allLogs.subList(fromIndex, toIndex);

        int totalPages = allLogs.isEmpty() ? 0 : (int) Math.ceil((double) allLogs.size() / safeSize);
        return PageResponse.<AdminActivityLogResponse>builder()
                .content(content)
                .page(safePage)
                .size(safeSize)
                .totalElements(allLogs.size())
                .totalPages(totalPages)
                .last(toIndex >= allLogs.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<ByteArrayResource> exportActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        List<AdminActivityLogResponse> logs = buildFilteredActivityLogs(query, type, dateFrom, dateTo);
        StringBuilder csv = new StringBuilder("Time,Type,Action,Actor,Target,Status,Description\r\n");
        logs.forEach(item -> csv
                .append(csvValue(item.getCreatedAt() != null ? item.getCreatedAt().format(CSV_DATE_FORMATTER) : ""))
                .append(',')
                .append(csvValue(item.getType()))
                .append(',')
                .append(csvValue(item.getTitle()))
                .append(',')
                .append(csvValue(item.getActor()))
                .append(',')
                .append(csvValue(item.getTarget()))
                .append(',')
                .append(csvValue(item.getStatus()))
                .append(',')
                .append(csvValue(item.getDescription()))
                .append("\r\n"));

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename("admin-activity-logs.csv", StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(new ByteArrayResource(bytes));
    }

    private AdminUserResponse mapUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .verificationStatus(user.getVerificationStatus() != null ? user.getVerificationStatus().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .planName(user.getPlan() != null ? user.getPlan().getPlanName() : "FREE")
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                .createdAt(user.getCreatedAt())
                .build();
    }

    private List<AdminActivityItemResponse> buildRecentActivities(
            List<User> users,
            List<Document> documents,
            List<Report> reports,
            List<ChatSession> chatSessions
    ) {
        return Stream.concat(
                        Stream.concat(
                                users.stream().map(user -> AdminActivityItemResponse.builder()
                                        .title("New User Registered")
                                        .text((user.getFullName() == null || user.getFullName().isBlank() ? user.getEmail() : user.getFullName()) + " joined the platform")
                                        .tone("blue")
                                        .createdAt(user.getCreatedAt())
                                        .build()),
                                documents.stream().map(document -> AdminActivityItemResponse.builder()
                                        .title("Document Uploaded")
                                        .text(document.getTitle())
                                        .tone("green")
                                        .createdAt(document.getCreatedAt())
                                        .build())
                        ),
                        Stream.concat(
                                reports.stream().map(report -> AdminActivityItemResponse.builder()
                                        .title("Report Submitted")
                                        .text((report.getReportType() != null ? report.getReportType().name() : "REPORT") + " - " + (report.getDocument() != null ? report.getDocument().getTitle() : "Document"))
                                        .tone("orange")
                                        .createdAt(report.getCreatedAt())
                                        .build()),
                                chatSessions.stream().map(session -> AdminActivityItemResponse.builder()
                                        .title("AI Chat Started")
                                        .text(buildChatActivityText(session))
                                        .tone("purple")
                                        .createdAt(session.getCreatedAt())
                                        .build())
                        )
                )
                .filter(item -> item.getCreatedAt() != null)
                .sorted(Comparator.comparing(AdminActivityItemResponse::getCreatedAt).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    private String buildChatActivityText(ChatSession session) {
        String userName = session.getUser() != null
                ? (session.getUser().getFullName() == null || session.getUser().getFullName().isBlank()
                    ? session.getUser().getEmail()
                    : session.getUser().getFullName())
                : "A user";
        if (session.getDocument() != null && session.getDocument().getTitle() != null && !session.getDocument().getTitle().isBlank()) {
            return userName + " started a chat on " + session.getDocument().getTitle();
        }
        return userName + " started a new AI chat session";
    }

    private List<AdminActivityLogResponse> buildFilteredActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        List<AdminActivityLogResponse> logs = buildAllActivityLogs();
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedType = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);

        return logs.stream()
                .filter(item -> normalizedType.isBlank() || normalizedType.equalsIgnoreCase(item.getType()))
                .filter(item -> normalizedQuery.isBlank() || matchesActivityQuery(item, normalizedQuery))
                .filter(item -> matchesDateRange(item.getCreatedAt(), dateFrom, dateTo))
                .sorted(Comparator.comparing(AdminActivityLogResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    private List<AdminActivityLogResponse> buildAllActivityLogs() {
        List<AdminActivityLogResponse> logs = new ArrayList<>();

        userRepository.findAll().forEach(user -> logs.add(AdminActivityLogResponse.builder()
                .type("user")
                .title("New User Registered")
                .description("A new account joined the platform")
                .actor(readUserName(user))
                .target(user.getEmail())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .tone("blue")
                .createdAt(user.getCreatedAt())
                .build()));

        documentRepository.findAll().forEach(document -> logs.add(AdminActivityLogResponse.builder()
                .type("document")
                .title("Document Uploaded")
                .description("A new document was uploaded")
                .actor(document.getUser() != null ? readUserName(document.getUser()) : "Unknown user")
                .target(document.getTitle())
                .status(document.getModerationStatus() != null ? document.getModerationStatus().name() : "APPROVED")
                .tone("green")
                .createdAt(document.getCreatedAt())
                .build()));

        documentDownloadRepository.findAll().forEach(download -> logs.add(AdminActivityLogResponse.builder()
                .type("download")
                .title("Document Downloaded")
                .description("A user downloaded a document")
                .actor(download.getUser() != null ? readUserName(download.getUser()) : "Anonymous")
                .target(download.getDocument() != null ? download.getDocument().getTitle() : "Document")
                .status("SUCCESS")
                .tone("blue")
                .createdAt(download.getDownloadedAt())
                .build()));

        reportRepository.findAll().forEach(report -> logs.add(AdminActivityLogResponse.builder()
                .type("report")
                .title("Report Submitted")
                .description(report.getReportReason() != null && !report.getReportReason().isBlank()
                        ? report.getReportReason()
                        : "A content report was submitted")
                .actor(report.getReporter() != null ? readUserName(report.getReporter()) : "Unknown user")
                .target(report.getDocument() != null ? report.getDocument().getTitle() : "Document")
                .status(report.getStatus() != null ? report.getStatus().name() : "PENDING")
                .tone("orange")
                .createdAt(report.getCreatedAt())
                .build()));

        chatSessionRepository.findAll().forEach(session -> logs.add(AdminActivityLogResponse.builder()
                .type("ai")
                .title("AI Chat Started")
                .description(session.getDocument() != null && session.getDocument().getTitle() != null
                        ? "AI chat started for " + session.getDocument().getTitle()
                        : "A new AI chat session was created")
                .actor(session.getUser() != null ? readUserName(session.getUser()) : "Unknown user")
                .target(session.getDocument() != null ? session.getDocument().getTitle() : (session.getSessionTitle() != null ? session.getSessionTitle() : "General chat"))
                .status("STARTED")
                .tone("purple")
                .createdAt(session.getCreatedAt())
                .build()));

        return logs;
    }

    private boolean matchesActivityQuery(AdminActivityLogResponse item, String query) {
        return Stream.of(item.getTitle(), item.getDescription(), item.getActor(), item.getTarget(), item.getStatus(), item.getType())
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(query));
    }

    private boolean matchesDateRange(LocalDateTime createdAt, LocalDate dateFrom, LocalDate dateTo) {
        if (createdAt == null) {
            return false;
        }
        LocalDate date = createdAt.toLocalDate();
        if (dateFrom != null && date.isBefore(dateFrom)) {
            return false;
        }
        if (dateTo != null && date.isAfter(dateTo)) {
            return false;
        }
        return true;
    }

    private String readUserName(User user) {
        if (user == null) {
            return "Unknown user";
        }
        String fullName = user.getFullName();
        return fullName == null || fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String csvValue(String value) {
        String safe = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + safe + "\"";
    }

    private List<AdminAnalyticsPointResponse> buildDailyCountSeriesFromDocuments(List<Document> documents, int days) {
        Map<LocalDate, Long> values = initDaySeries(days);
        documents.stream()
                .map(Document::getCreatedAt)
                .filter(timestamp -> timestamp != null)
                .map(LocalDateTime::toLocalDate)
                .forEach(date -> values.computeIfPresent(date, (key, value) -> value + 1));
        return toPointResponse(values);
    }

    private List<AdminAnalyticsPointResponse> buildDailyCountSeriesFromDownloads(List<DocumentDownload> downloads, int days) {
        Map<LocalDate, Long> values = initDaySeries(days);
        downloads.stream()
                .map(DocumentDownload::getDownloadedAt)
                .filter(timestamp -> timestamp != null)
                .map(LocalDateTime::toLocalDate)
                .forEach(date -> values.computeIfPresent(date, (key, value) -> value + 1));
        return toPointResponse(values);
    }

    private List<AdminAnalyticsPointResponse> buildDocumentDistribution(List<Document> documents) {
        return documents.stream()
                .collect(Collectors.groupingBy(
                        document -> document.getCourse() != null && document.getCourse().getCourseCode() != null && !document.getCourse().getCourseCode().isBlank()
                                ? document.getCourse().getCourseCode()
                                : "Unassigned",
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<AdminAnalyticsPointResponse> buildActiveUsersByDay(
            List<Document> documents,
            List<DocumentDownload> downloads,
            List<DocumentView> views,
            List<ChatSession> chatSessions,
            int days
    ) {
        Map<LocalDate, Set<Long>> activeUsers = new LinkedHashMap<>();
        initDaySeries(days).keySet().forEach(date -> activeUsers.put(date, new HashSet<>()));

        documents.forEach(document -> addActiveUser(activeUsers, document.getCreatedAt(), document.getUser() != null ? document.getUser().getId() : null));
        downloads.forEach(download -> addActiveUser(activeUsers, download.getDownloadedAt(), download.getUser() != null ? download.getUser().getId() : null));
        views.forEach(view -> addActiveUser(activeUsers, view.getViewedAt(), view.getUser() != null ? view.getUser().getId() : null));
        chatSessions.forEach(session -> addActiveUser(activeUsers, session.getCreatedAt(), session.getUser() != null ? session.getUser().getId() : null));

        return activeUsers.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(DAY_LABEL_FORMATTER))
                        .value((long) entry.getValue().size())
                        .build())
                .collect(Collectors.toList());
    }

    private void addActiveUser(Map<LocalDate, Set<Long>> activeUsers, LocalDateTime timestamp, Long userId) {
        if (timestamp == null || userId == null) {
            return;
        }
        LocalDate date = timestamp.toLocalDate();
        Set<Long> users = activeUsers.get(date);
        if (users != null) {
            users.add(userId);
        }
    }

    private List<AdminAnalyticsPointResponse> buildAiChatUsage(List<ChatMessage> chatMessages) {
        LocalDateTime end = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        LocalDateTime start = end.minusHours(23);
        Map<LocalDateTime, Long> buckets = new LinkedHashMap<>();
        for (int i = 0; i < 24; i += 1) {
            LocalDateTime bucket = start.plusHours(i);
            buckets.put(bucket, 0L);
        }

        chatMessages.stream()
                .filter(message -> message.getSenderType() == SenderType.AI && message.getCreatedAt() != null)
                .map(ChatMessage::getCreatedAt)
                .filter(timestamp -> !timestamp.isBefore(start) && !timestamp.isAfter(end.plusHours(1).minusNanos(1)))
                .map(timestamp -> timestamp.withMinute(0).withSecond(0).withNano(0))
                .forEach(bucket -> buckets.computeIfPresent(bucket, (key, value) -> value + 1));

        return buckets.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(HOUR_LABEL_FORMATTER))
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<LocalDate, Long> initDaySeries(int days) {
        Map<LocalDate, Long> values = new LinkedHashMap<>();
        LocalDate start = LocalDate.now().minusDays(days - 1L);
        for (int i = 0; i < days; i += 1) {
            values.put(start.plusDays(i), 0L);
        }
        return values;
    }

    private List<AdminAnalyticsPointResponse> toPointResponse(Map<LocalDate, Long> values) {
        return values.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(DAY_LABEL_FORMATTER))
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
