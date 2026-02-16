package com.example.ragchat.service;

import com.example.ragchat.dto.PagedResponse;
import com.example.ragchat.dto.SessionDtos;
import com.example.ragchat.entity.ChatSession;
import com.example.ragchat.exception.AppException;
import com.example.ragchat.repository.ChatSessionRepository;
import com.example.ragchat.util.PaginationUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SessionService {
    private final ChatSessionRepository chatSessionRepository;

    public SessionService(ChatSessionRepository chatSessionRepository) {
        this.chatSessionRepository = chatSessionRepository;
    }

    @Transactional
    public SessionDtos.SessionResponse create(SessionDtos.CreateSessionRequest request) {
        ChatSession session = new ChatSession();
        session.setUserId(request.userId());
        session.setTitle(request.title() == null || request.title().isBlank() ? "New Chat" : request.title());

        ChatSession saved = chatSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<SessionDtos.SessionResponse> list(String userId, Integer page, Integer limit) {
        int sanitizedPage = PaginationUtil.sanitizePage(page);
        int sanitizedLimit = PaginationUtil.sanitizeLimit(limit);

        Page<ChatSession> result = chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(
                userId,
                PageRequest.of(sanitizedPage - 1, sanitizedLimit)
        );

        return new PagedResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                new PagedResponse.Pagination(sanitizedPage, sanitizedLimit, result.getTotalElements(), result.getTotalPages())
        );
    }

    @Transactional
    public SessionDtos.SessionResponse rename(UUID id, String title) {
        ChatSession session = getByIdOrThrow(id);
        session.setTitle(title);
        return toResponse(chatSessionRepository.save(session));
    }

    @Transactional
    public SessionDtos.SessionResponse favorite(UUID id, boolean isFavorite) {
        ChatSession session = getByIdOrThrow(id);
        session.setFavorite(isFavorite);
        return toResponse(chatSessionRepository.save(session));
    }

    @Transactional
    public void delete(UUID id) {
        ChatSession session = getByIdOrThrow(id);
        chatSessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public ChatSession getByIdOrThrow(UUID id) {
        return chatSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(404, "Session not found", "SESSION_NOT_FOUND"));
    }

    private SessionDtos.SessionResponse toResponse(ChatSession session) {
        return new SessionDtos.SessionResponse(
                session.getId(),
                session.getUserId(),
                session.getTitle(),
                session.isFavorite(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
