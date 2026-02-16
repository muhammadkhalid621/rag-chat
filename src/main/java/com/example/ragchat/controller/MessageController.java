package com.example.ragchat.controller;

import com.example.ragchat.dto.MessageDtos;
import com.example.ragchat.dto.PagedResponse;
import com.example.ragchat.entity.SenderType;
import com.example.ragchat.service.AiChatService;
import com.example.ragchat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{id}/messages")
public class MessageController {
    private final MessageService messageService;
    private final AiChatService aiChatService;

    public MessageController(MessageService messageService, AiChatService aiChatService) {
        this.messageService = messageService;
        this.aiChatService = aiChatService;
    }

    @PostMapping
    public ResponseEntity<MessageDtos.MessageResponse> create(
            @PathVariable UUID id,
            @Valid @RequestBody MessageDtos.CreateMessageRequest request
    ) {
        return ResponseEntity.status(201).body(messageService.create(id, request));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<MessageDtos.MessageResponse>> list(
            @PathVariable UUID id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(messageService.list(id, page, limit));
    }

    @PostMapping("/chat")
    public ResponseEntity<MessageDtos.ChatTurnResponse> generateChat(
            @PathVariable UUID id,
            @Valid @RequestBody MessageDtos.GenerateChatRequest request
    ) {
        MessageDtos.MessageResponse userMessage = messageService.create(
                id,
                new MessageDtos.CreateMessageRequest(SenderType.user, request.message(), request.retrievedContext())
        );

        String assistantText = aiChatService.generateReply(
                messageService.recentMessages(id),
                request.message(),
                request.retrievedContext()
        );

        MessageDtos.MessageResponse assistantMessage = messageService.create(
                id,
                new MessageDtos.CreateMessageRequest(SenderType.assistant, assistantText, request.retrievedContext())
        );

        return ResponseEntity.status(201).body(new MessageDtos.ChatTurnResponse(userMessage, assistantMessage));
    }
}
