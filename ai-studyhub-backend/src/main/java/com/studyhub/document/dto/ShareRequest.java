package com.studyhub.document.dto;

import com.studyhub.common.enums.SharePermission;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShareRequest {

    @NotBlank(message = "Email người nhận chia sẻ không được để trống")
    @Email(message = "Email không hợp lệ")
    private String sharedUserEmail;

    @NotNull(message = "Quyền chia sẻ không được để trống")
    private SharePermission permission;
}
