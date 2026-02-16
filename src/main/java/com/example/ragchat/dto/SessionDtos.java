package com.example.ragchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SessionDtos {
    public record CreateSessionRequest(
            @NotBlank @Size(max = 255) String userId,
            @Size(min = 1, max = 255) String title
    ) {}

    public record RenameSessionRequest(@NotBlank @Size(max = 255) String title) {}

    public record FavoriteSessionRequest(@NotNull Boolean isFavorite) {}

    public record SessionResponse(
            UUID id,
            String userId,
            String title,
            boolean isFavorite,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}
}
