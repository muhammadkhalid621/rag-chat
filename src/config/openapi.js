const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RAG Chat Storage Microservice API',
    version: '1.0.0',
    description: 'APIs to manage chat sessions and messages for a RAG chatbot system'
  },
  servers: [
    {
      url: 'http://localhost:3005',
      description: 'Local'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/health/live': {
      get: {
        summary: 'Liveness probe',
        security: [],
        responses: {
          200: { description: 'Service is alive' }
        }
      }
    },
    '/health/ready': {
      get: {
        summary: 'Readiness probe',
        security: [],
        responses: {
          200: { description: 'Service can access DB' }
        }
      }
    },
    '/api/v1/sessions': {
      post: {
        summary: 'Create a new chat session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string' },
                  title: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Session created' }
        }
      },
      get: {
        summary: 'List user sessions',
        parameters: [
          { name: 'userId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Sessions retrieved' }
        }
      }
    },
    '/api/v1/sessions/{id}/rename': {
      patch: {
        summary: 'Rename a session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Session renamed' }
        }
      }
    },
    '/api/v1/sessions/{id}/favorite': {
      patch: {
        summary: 'Mark or unmark a session as favorite',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isFavorite'],
                properties: {
                  isFavorite: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Favorite status updated' }
        }
      }
    },
    '/api/v1/sessions/{id}': {
      delete: {
        summary: 'Delete a session and its messages',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Session deleted' }
        }
      }
    },
    '/api/v1/sessions/{id}/messages': {
      post: {
        summary: 'Add message to a session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sender', 'content'],
                properties: {
                  sender: { type: 'string', enum: ['user', 'assistant', 'system'] },
                  content: { type: 'string' },
                  retrievedContext: { nullable: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Message stored' }
        }
      },
      get: {
        summary: 'Get paginated message history',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Messages retrieved' }
        }
      }
    }
  }
};

module.exports = { openApiSpec };
