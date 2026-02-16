package com.example.ragchat.util;

import com.example.ragchat.exception.AppException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class JsonUtil {
    private final ObjectMapper objectMapper;

    public JsonUtil(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new AppException(400, "Invalid JSON payload for retrievedContext", "INVALID_RETRIEVED_CONTEXT");
        }
    }

    public Object fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(value, Object.class);
        } catch (JsonProcessingException ex) {
            throw new AppException(500, "Stored context JSON is malformed", "MALFORMED_CONTEXT_JSON");
        }
    }
}
