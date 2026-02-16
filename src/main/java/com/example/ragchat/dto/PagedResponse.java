package com.example.ragchat.dto;

import java.util.List;

public record PagedResponse<T>(List<T> items, Pagination pagination) {
    public record Pagination(int page, int limit, long total, long totalPages) {}
}
