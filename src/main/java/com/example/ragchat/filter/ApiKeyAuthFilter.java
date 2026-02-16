package com.example.ragchat.filter;

import com.example.ragchat.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {
    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/health",
            "/docs",
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator"
    );

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public ApiKeyAuthFilter(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        boolean isPublicPath = PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);
        if (isPublicPath) {
            filterChain.doFilter(request, response);
            return;
        }

        String providedApiKey = request.getHeader("x-api-key");
        if (providedApiKey == null || !providedApiKey.equals(appProperties.apiKey())) {
            writeUnauthorized(response, request);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, HttpServletRequest request) throws IOException {
        response.setStatus(401);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String requestId = (String) request.getAttribute(RequestIdFilter.REQUEST_ID_HEADER);
        objectMapper.writeValue(response.getWriter(), Map.of(
                "error", "Unauthorized: invalid or missing API key",
                "requestId", requestId
        ));
    }
}
