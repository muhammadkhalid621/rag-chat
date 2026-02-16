package com.example.ragchat.controller;

import com.example.ragchat.dto.PagedResponse;
import com.example.ragchat.dto.SessionDtos;
import com.example.ragchat.service.SessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@Validated
public class SessionController {
    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionDtos.SessionResponse> create(@Valid @RequestBody SessionDtos.CreateSessionRequest request) {
        return ResponseEntity.status(201).body(sessionService.create(request));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<SessionDtos.SessionResponse>> list(
            @RequestParam @NotBlank String userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(sessionService.list(userId, page, limit));
    }

    @PatchMapping("/{id}/rename")
    public ResponseEntity<SessionDtos.SessionResponse> rename(
            @PathVariable UUID id,
            @Valid @RequestBody SessionDtos.RenameSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.rename(id, request.title()));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<SessionDtos.SessionResponse> favorite(
            @PathVariable UUID id,
            @Valid @RequestBody SessionDtos.FavoriteSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.favorite(id, request.isFavorite()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
