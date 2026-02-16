import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { healthRouter } from '../src/routes/health';
import { messagesRouter } from '../src/routes/messages';
import { sessionsRouter } from '../src/routes/sessions';
import { apiKeyAuth } from '../src/middlewares/apiKeyAuth';
import { pool } from '../src/db/pool';

process.env.NODE_ENV = 'test';
process.env.PORT = '3005';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/rag_chat';
process.env.API_KEY = 'test-api-key-123456';
process.env.OPENAI_API_KEY = 'test-openai-key-123456';
process.env.OPENAI_MODEL = 'gpt-4o-mini';
process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '120';
process.env.LOG_LEVEL = 'silent';
process.env.CORS_ORIGIN = 'http://localhost:3005';

type SessionRow = {
  id: string;
  user_id: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  retrieved_context: Record<string, unknown> | string | null;
  created_at: string;
};

let sessions: SessionRow[] = [];
let messages: MessageRow[] = [];
const sessionId = '158d5c05-f056-4c95-95d1-ed2a7498f0f2';

const originalPoolQuery = pool.query;
const originalFetch = global.fetch;

function nowIso(): string {
  return '2026-02-16T00:00:00.000Z';
}

function makeSessionResponse(session: SessionRow) {
  return {
    id: session.id,
    userId: session.user_id,
    title: session.title,
    isFavorite: session.is_favorite,
    createdAt: session.created_at,
    updatedAt: session.updated_at
  };
}

function makeMessageResponse(message: MessageRow) {
  return {
    id: message.id,
    sessionId: message.session_id,
    sender: message.sender,
    content: message.content,
    retrievedContext: message.retrieved_context,
    createdAt: message.created_at
  };
}

function createMockRes() {
  const res: Partial<Response> & { statusCode: number; body?: unknown } = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this as Response;
    },
    json(payload: unknown) {
      this.body = payload;
      return this as Response;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this as Response;
    }
  };

  return res;
}

function getRouteHandler(router: typeof sessionsRouter | typeof messagesRouter | typeof healthRouter, method: string, path: string) {
  const layer = router.stack.find((stackLayer: any) => stackLayer.route?.path === path && stackLayer.route.methods[method]);
  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }
  return layer.route!.stack[0].handle as (req: Request, res: Response, next: NextFunction) => void;
}

async function invokeHandler(
  handler: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>
): Promise<{ statusCode: number; body: unknown }> {
  const res = createMockRes();

  await new Promise<void>((resolve, reject) => {
    const next: NextFunction = (err?: unknown) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    };

    handler(req as Request, res as Response, next);
    setImmediate(resolve);
  });

  return {
    statusCode: res.statusCode,
    body: res.body
  };
}

before(() => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ output_text: 'assistant generated answer' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })) as typeof global.fetch;
});

beforeEach(() => {
  sessions = [
    {
      id: sessionId,
      user_id: 'user-1',
      title: 'Chat 1',
      is_favorite: false,
      created_at: nowIso(),
      updated_at: nowIso()
    }
  ];

  messages = [
    {
      id: 'msg-seed-1',
      session_id: sessionId,
      sender: 'assistant',
      content: 'previous reply',
      retrieved_context: null,
      created_at: nowIso()
    }
  ];

  (pool as any).query = async (text: string, params: unknown[] = []) => {
    if (text.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }

    if (text.includes('INSERT INTO chat_sessions')) {
      const userId = params[0] as string;
      const title = params[1] as string;
      const newSession: SessionRow = {
        id: 'new-session-id',
        user_id: userId,
        title,
        is_favorite: false,
        created_at: nowIso(),
        updated_at: nowIso()
      };
      sessions.push(newSession);
      return { rows: [makeSessionResponse(newSession)], rowCount: 1 };
    }

    if (text.includes('FROM chat_sessions') && text.includes('WHERE user_id = $1') && text.includes('LIMIT')) {
      const userId = params[0] as string;
      const limit = params[1] as number;
      const offset = params[2] as number;
      const filtered = sessions.filter((s) => s.user_id === userId).slice(offset, offset + limit);
      return { rows: filtered.map(makeSessionResponse), rowCount: filtered.length };
    }

    if (text.includes('SELECT COUNT(*)::int AS total FROM chat_sessions')) {
      const userId = params[0] as string;
      const total = sessions.filter((s) => s.user_id === userId).length;
      return { rows: [{ total }], rowCount: 1 };
    }

    if (text.includes('UPDATE chat_sessions') && text.includes('SET title = $2')) {
      const id = params[0] as string;
      const title = params[1] as string;
      const target = sessions.find((s) => s.id === id);
      if (!target) return { rows: [], rowCount: 0 };
      target.title = title;
      target.updated_at = nowIso();
      return { rows: [makeSessionResponse(target)], rowCount: 1 };
    }

    if (text.includes('UPDATE chat_sessions') && text.includes('SET is_favorite = $2')) {
      const id = params[0] as string;
      const isFavorite = params[1] as boolean;
      const target = sessions.find((s) => s.id === id);
      if (!target) return { rows: [], rowCount: 0 };
      target.is_favorite = isFavorite;
      target.updated_at = nowIso();
      return { rows: [makeSessionResponse(target)], rowCount: 1 };
    }

    if (text.includes('DELETE FROM chat_sessions WHERE id = $1 RETURNING id')) {
      const id = params[0] as string;
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      sessions.splice(index, 1);
      messages = messages.filter((m) => m.session_id !== id);
      return { rows: [{ id }], rowCount: 1 };
    }

    if (text.trim() === 'SELECT id FROM chat_sessions WHERE id = $1') {
      const id = params[0] as string;
      const exists = sessions.some((s) => s.id === id);
      return { rows: exists ? [{ id }] : [], rowCount: exists ? 1 : 0 };
    }

    if (text.includes('INSERT INTO chat_messages')) {
      const sessionIdParam = params[0] as string;
      const sender = params[1] as 'user' | 'assistant' | 'system';
      const content = params[2] as string;
      const retrievedContext = (params[3] as Record<string, unknown> | string | null) ?? null;
      const newMessage: MessageRow = {
        id: `msg-${messages.length + 1}`,
        session_id: sessionIdParam,
        sender,
        content,
        retrieved_context: retrievedContext,
        created_at: nowIso()
      };
      messages.push(newMessage);
      return { rows: [makeMessageResponse(newMessage)], rowCount: 1 };
    }

    if (text.trim() === 'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1') {
      const id = params[0] as string;
      const target = sessions.find((s) => s.id === id);
      if (target) target.updated_at = nowIso();
      return { rows: [], rowCount: target ? 1 : 0 };
    }

    if (text.includes('FROM chat_messages') && text.includes('ORDER BY created_at ASC')) {
      const sessionIdParam = params[0] as string;
      const limit = params[1] as number;
      const offset = params[2] as number;
      const filtered = messages.filter((m) => m.session_id === sessionIdParam).slice(offset, offset + limit);
      return { rows: filtered.map(makeMessageResponse), rowCount: filtered.length };
    }

    if (text.includes('SELECT COUNT(*)::int AS total FROM chat_messages')) {
      const sessionIdParam = params[0] as string;
      const total = messages.filter((m) => m.session_id === sessionIdParam).length;
      return { rows: [{ total }], rowCount: 1 };
    }

    if (text.includes('FROM chat_messages') && text.includes('ORDER BY created_at DESC')) {
      const sessionIdParam = params[0] as string;
      const limit = params[1] as number;
      const filtered = messages
        .filter((m) => m.session_id === sessionIdParam)
        .slice()
        .reverse()
        .slice(0, limit);
      return { rows: filtered.map(makeMessageResponse), rowCount: filtered.length };
    }

    throw new Error(`Unhandled query in test mock: ${text}`);
  };
});

after(() => {
  (pool as any).query = originalPoolQuery;
  global.fetch = originalFetch;
});

describe('Health endpoints', () => {
  test('GET /health/live returns ok', async () => {
    const handler = getRouteHandler(healthRouter, 'get', '/live');
    const result = await invokeHandler(handler, { method: 'GET', path: '/health/live' });

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, { status: 'ok' });
  });

  test('GET /health/ready returns ready', async () => {
    const handler = getRouteHandler(healthRouter, 'get', '/ready');
    const result = await invokeHandler(handler, { method: 'GET', path: '/health/ready' });

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, { status: 'ready' });
  });
});

describe('Auth middleware', () => {
  test('apiKeyAuth rejects missing API key', async () => {
    const req = { header: () => undefined } as unknown as Request;
    const res = {} as Response;

    await assert.rejects(
      () =>
        new Promise<void>((resolve, reject) => {
          apiKeyAuth(req, res, (err?: unknown) => {
            if (err) return reject(err);
            resolve();
          });
        }),
      (err: unknown) => {
        const error = err as Error;
        return error.message.includes('Unauthorized: invalid or missing API key');
      }
    );
  });
});

describe('Session endpoints', () => {
  test('POST /sessions creates a session', async () => {
    const handler = getRouteHandler(sessionsRouter, 'post', '/');
    const result = await invokeHandler(handler, {
      method: 'POST',
      path: '/api/v1/sessions',
      body: { userId: 'user-1', title: 'Support' }
    });

    assert.equal(result.statusCode, 201);
    assert.equal((result.body as any).userId, 'user-1');
  });

  test('GET /sessions lists sessions with pagination', async () => {
    const handler = getRouteHandler(sessionsRouter, 'get', '/');
    const result = await invokeHandler(handler, {
      method: 'GET',
      path: '/api/v1/sessions',
      query: { userId: 'user-1', page: '1', limit: '20' }
    });

    assert.equal(result.statusCode, 200);
    assert.equal((result.body as any).items.length, 1);
    assert.equal((result.body as any).pagination.total, 1);
  });

  test('PATCH /sessions/:id/rename renames session', async () => {
    const handler = getRouteHandler(sessionsRouter, 'patch', '/:id/rename');
    const result = await invokeHandler(handler, {
      method: 'PATCH',
      path: `/api/v1/sessions/${sessionId}/rename`,
      params: { id: sessionId },
      body: { title: 'Renamed' }
    });

    assert.equal(result.statusCode, 200);
    assert.equal((result.body as any).title, 'Renamed');
  });

  test('PATCH /sessions/:id/favorite updates favorite', async () => {
    const handler = getRouteHandler(sessionsRouter, 'patch', '/:id/favorite');
    const result = await invokeHandler(handler, {
      method: 'PATCH',
      path: `/api/v1/sessions/${sessionId}/favorite`,
      params: { id: sessionId },
      body: { isFavorite: true }
    });

    assert.equal(result.statusCode, 200);
    assert.equal((result.body as any).isFavorite, true);
  });

  test('DELETE /sessions/:id deletes session', async () => {
    const handler = getRouteHandler(sessionsRouter, 'delete', '/:id');
    const result = await invokeHandler(handler, {
      method: 'DELETE',
      path: `/api/v1/sessions/${sessionId}`,
      params: { id: sessionId }
    });

    assert.equal(result.statusCode, 204);
  });
});

describe('Message endpoints', () => {
  test('POST /sessions/:id/messages stores a message', async () => {
    const handler = getRouteHandler(messagesRouter, 'post', '/');
    const result = await invokeHandler(handler, {
      method: 'POST',
      path: `/api/v1/sessions/${sessionId}/messages`,
      params: { id: sessionId },
      body: { sender: 'user', content: 'hello', retrievedContext: { doc: 1 } }
    });

    assert.equal(result.statusCode, 201);
    assert.equal((result.body as any).sender, 'user');
  });

  test('GET /sessions/:id/messages lists messages', async () => {
    const handler = getRouteHandler(messagesRouter, 'get', '/');
    const result = await invokeHandler(handler, {
      method: 'GET',
      path: `/api/v1/sessions/${sessionId}/messages`,
      params: { id: sessionId },
      query: { page: '1', limit: '20' }
    });

    assert.equal(result.statusCode, 200);
    assert.equal((result.body as any).items.length >= 1, true);
  });

  test('POST /sessions/:id/messages/chat stores user and assistant messages', async () => {
    const handler = getRouteHandler(messagesRouter, 'post', '/chat');
    const result = await invokeHandler(handler, {
      method: 'POST',
      path: `/api/v1/sessions/${sessionId}/messages/chat`,
      params: { id: sessionId },
      body: { message: 'Summarize this', retrievedContext: 'doc-id-1' }
    });

    assert.equal(result.statusCode, 201);
    assert.equal((result.body as any).userMessage.sender, 'user');
    assert.equal((result.body as any).assistantMessage.sender, 'assistant');
  });
});
