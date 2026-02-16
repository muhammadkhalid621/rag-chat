import { pool } from '../db/pool';
import { AppError } from '../utils/errors';

export type RetrievedContext = Record<string, unknown> | string;

export type MessageRecord = {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  retrievedContext: RetrievedContext | null;
  createdAt: string;
};

type CreateMessageInput = {
  sender: 'user' | 'assistant' | 'system';
  content: string;
  retrievedContext?: RetrievedContext;
};

export async function createMessage(sessionId: string, payload: CreateMessageInput): Promise<MessageRecord> {
  const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id = $1', [sessionId]);
  if (sessionCheck.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  const query = `
    INSERT INTO chat_messages (session_id, sender, content, retrieved_context)
    VALUES ($1, $2, $3, $4)
    RETURNING id, session_id AS "sessionId", sender, content, retrieved_context AS "retrievedContext", created_at AS "createdAt"
  `;

  const result = await pool.query<MessageRecord>(query, [
    sessionId,
    payload.sender,
    payload.content,
    payload.retrievedContext ?? null
  ]);

  await pool.query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1', [sessionId]);

  return result.rows[0];
}

export async function listMessages(
  sessionId: string,
  { limit, offset }: { limit: number; offset: number }
): Promise<{ items: MessageRecord[]; total: number }> {
  const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id = $1', [sessionId]);
  if (sessionCheck.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  const result = await pool.query<MessageRecord>(
    `
    SELECT id, session_id AS "sessionId", sender, content, retrieved_context AS "retrievedContext", created_at AS "createdAt"
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC
    LIMIT $2 OFFSET $3
    `,
    [sessionId, limit, offset]
  );

  const countResult = await pool.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM chat_messages WHERE session_id = $1',
    [sessionId]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total
  };
}

export async function getRecentMessages(sessionId: string, limit = 20): Promise<MessageRecord[]> {
  const result = await pool.query<MessageRecord>(
    `
    SELECT id, session_id AS "sessionId", sender, content, retrieved_context AS "retrievedContext", created_at AS "createdAt"
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [sessionId, limit]
  );

  return result.rows.reverse();
}
