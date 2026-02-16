package com.example.ragchat.dto;

import com.example.ragchat.entity.SenderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class MessageDtos {
    public record CreateMessageRequest(
            @NotNull SenderType sender,
            @NotBlank String content,
            Object retrievedContext
    ) {}

    public record GenerateChatRequest(
            @NotBlank String message,
            Object retrievedContext
    ) {}

    public record MessageResponse(
            UUID id,
            UUID sessionId,
            SenderType sender,
            String content,
            Object retrievedContext,
            OffsetDateTime createdAt
    ) {}

    public record ChatTurnResponse(MessageResponse userMessage, MessageResponse assistantMessage) {}
}
