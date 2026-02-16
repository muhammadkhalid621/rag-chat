package com.example.ragchat.service;

import com.example.ragchat.dto.MessageDtos;
import com.example.ragchat.dto.PagedResponse;
import com.example.ragchat.entity.ChatMessage;
import com.example.ragchat.entity.ChatSession;
import com.example.ragchat.repository.ChatMessageRepository;
import com.example.ragchat.util.JsonUtil;
import com.example.ragchat.util.PaginationUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final SessionService sessionService;
    private final JsonUtil jsonUtil;

    public MessageService(ChatMessageRepository chatMessageRepository, SessionService sessionService, JsonUtil jsonUtil) {
        this.chatMessageRepository = chatMessageRepository;
        this.sessionService = sessionService;
        this.jsonUtil = jsonUtil;
    }

    @Transactional
    public MessageDtos.MessageResponse create(UUID sessionId, MessageDtos.CreateMessageRequest request) {
        ChatSession session = sessionService.getByIdOrThrow(sessionId);

        ChatMessage message = new ChatMessage();
        message.setSession(session);
        message.setSender(request.sender());
        message.setContent(request.content());
        message.setRetrievedContext(jsonUtil.toJson(request.retrievedContext()));

        ChatMessage saved = chatMessageRepository.save(message);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MessageDtos.MessageResponse> list(UUID sessionId, Integer page, Integer limit) {
        ChatSession session = sessionService.getByIdOrThrow(sessionId);
        int sanitizedPage = PaginationUtil.sanitizePage(page);
        int sanitizedLimit = PaginationUtil.sanitizeLimit(limit);

        Page<ChatMessage> result = chatMessageRepository.findBySessionOrderByCreatedAtAsc(
                session,
                PageRequest.of(sanitizedPage - 1, sanitizedLimit)
        );

        return new PagedResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                new PagedResponse.Pagination(sanitizedPage, sanitizedLimit, result.getTotalElements(), result.getTotalPages())
        );
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> recentMessages(UUID sessionId) {
        ChatSession session = sessionService.getByIdOrThrow(sessionId);
        return chatMessageRepository.findTop20BySessionOrderByCreatedAtDesc(session);
    }

    public MessageDtos.MessageResponse toResponse(ChatMessage message) {
        return new MessageDtos.MessageResponse(
                message.getId(),
                message.getSession().getId(),
                message.getSender(),
                message.getContent(),
                jsonUtil.fromJson(message.getRetrievedContext()),
                message.getCreatedAt()
        );
    }
}
