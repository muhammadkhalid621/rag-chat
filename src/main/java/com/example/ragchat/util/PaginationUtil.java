package com.example.ragchat.util;

public final class PaginationUtil {
    private PaginationUtil() {}

    public static int sanitizePage(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    public static int sanitizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return 20;
        }
        return Math.min(limit, 100);
    }

    public static long totalPages(long total, int limit) {
        return (long) Math.ceil((double) total / limit);
    }
}
