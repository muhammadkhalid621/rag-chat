package com.example.ragchat;

import com.example.ragchat.util.PaginationUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaginationUtilTest {

    @Test
    void sanitizeDefaults() {
        assertEquals(1, PaginationUtil.sanitizePage(null));
        assertEquals(20, PaginationUtil.sanitizeLimit(null));
    }

    @Test
    void sanitizeInvalidValues() {
        assertEquals(1, PaginationUtil.sanitizePage(-2));
        assertEquals(100, PaginationUtil.sanitizeLimit(1000));
    }

    @Test
    void totalPagesCalculation() {
        assertEquals(3, PaginationUtil.totalPages(41, 20));
    }
}
