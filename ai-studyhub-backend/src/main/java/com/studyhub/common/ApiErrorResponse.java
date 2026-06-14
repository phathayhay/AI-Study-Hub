package com.studyhub.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Phản hồi lỗi từ hệ thống")
public class ApiErrorResponse {

    @Schema(description = "Trạng thái thành công (luôn là false đối với phản hồi lỗi)", example = "false")
    @Builder.Default
    private boolean success = false;

    @Schema(description = "Thông báo chi tiết về lỗi hoặc lý do thất bại", example = "Validation failed")
    private String message;

    @Schema(description = "Dữ liệu trả về (luôn là null hoặc không xuất hiện đối với lỗi)", example = "null")
    private Object data;

    @Builder.Default
    @Schema(description = "Thời điểm xảy ra lỗi")
    private LocalDateTime timestamp = LocalDateTime.now();
}
