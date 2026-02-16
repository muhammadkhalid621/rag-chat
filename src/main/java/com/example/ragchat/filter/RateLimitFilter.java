package com.example.ragchat.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
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
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/health",
            "/docs",
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator"
    );

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(key, this::newBucket);

        if (!bucket.tryConsume(1)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            String requestId = (String) request.getAttribute(RequestIdFilter.REQUEST_ID_HEADER);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "error", "Too many requests, please try again later.",
                    "requestId", requestId
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Bucket newBucket(String ignored) {
        Duration window = appProperties.rateLimit().window();
        Bandwidth limit = Bandwidth.builder()
                .capacity(appProperties.rateLimit().maxRequests())
                .refillIntervally(appProperties.rateLimit().maxRequests(), window)
                .build();

        return Bucket.builder().addLimit(limit).build();
    }
}
