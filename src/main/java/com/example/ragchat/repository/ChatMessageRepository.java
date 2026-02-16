package com.example.ragchat.repository;

import com.example.ragchat.entity.ChatMessage;
import com.example.ragchat.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Page<ChatMessage> findBySessionOrderByCreatedAtAsc(ChatSession session, Pageable pageable);
    List<ChatMessage> findTop20BySessionOrderByCreatedAtDesc(ChatSession session);
}
