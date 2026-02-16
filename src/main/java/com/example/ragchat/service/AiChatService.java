package com.example.ragchat.service;

import com.example.ragchat.config.AppProperties;
import com.example.ragchat.entity.ChatMessage;
import com.example.ragchat.entity.SenderType;
import com.example.ragchat.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiChatService {
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiChatService(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public String generateReply(List<ChatMessage> history, String message, Object retrievedContext) {
        if (appProperties.openAi().apiKey() == null || appProperties.openAi().apiKey().isBlank()) {
            throw new AppException(500, "OPENAI_API_KEY is not configured", "OPENAI_KEY_MISSING");
        }

        try {
            List<Map<String, Object>> input = new ArrayList<>();
            for (ChatMessage chatMessage : history.reversed()) {
                input.add(toInputItem(chatMessage.getSender(), chatMessage.getContent()));
            }

            String userContent = message;
            if (retrievedContext != null) {
                userContent = message + "\\n\\nRetrieved context:\\n" + objectMapper.writeValueAsString(retrievedContext);
            }
            input.add(toInputItem(SenderType.user, userContent));

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", appProperties.openAi().model());
            payload.put("input", input);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(appProperties.openAi().baseUrl() + "/responses"))
                    .timeout(appProperties.openAi().timeout())
                    .header("Authorization", "Bearer " + appProperties.openAi().apiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = objectMapper.readTree(response.body());

            if (response.statusCode() >= 400) {
                String error = body.path("error").path("message").asText("OpenAI request failed");
                throw new AppException(response.statusCode(), error, "OPENAI_REQUEST_FAILED");
            }

            String outputText = body.path("output_text").asText();
            if (outputText != null && !outputText.isBlank()) {
                return outputText;
            }

            JsonNode output = body.path("output");
            for (JsonNode item : output) {
                for (JsonNode contentItem : item.path("content")) {
                    if ("output_text".equals(contentItem.path("type").asText())) {
                        String text = contentItem.path("text").asText();
                        if (!text.isBlank()) {
                            return text;
                        }
                    }
                }
            }

            throw new AppException(502, "OpenAI response did not include assistant text", "OPENAI_EMPTY_RESPONSE");
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(502, "OpenAI request failed", "OPENAI_REQUEST_FAILED");
        }
    }

    private Map<String, Object> toInputItem(SenderType sender, String content) {
        Map<String, Object> inputItem = new HashMap<>();
        inputItem.put("role", sender.name());

        Map<String, Object> contentItem = new HashMap<>();
        contentItem.put("type", "input_text");
        contentItem.put("text", content);

        inputItem.put("content", List.of(contentItem));
        return inputItem;
    }
}
