package com.example.ragchat.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotBlank String apiKey,
        @NotBlank String corsOrigin,
        @NotNull RateLimit rateLimit,
        @NotNull OpenAi openAi
) {
    public record RateLimit(
            @Min(1) @Max(100000) int maxRequests,
            @NotNull Duration window
    ) {}

    public record OpenAi(
            String apiKey,
            @NotBlank String model,
            @NotBlank String baseUrl,
            @NotNull Duration timeout
    ) {}
}
