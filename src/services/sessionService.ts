import { pool } from '../db/pool';
import { AppError } from '../utils/errors';

export type SessionRecord = {
  id: string;
  userId: string;
  title: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function createSession({ userId, title }: { userId: string; title?: string }): Promise<SessionRecord> {
  const query = `
    INSERT INTO chat_sessions (user_id, title)
    VALUES ($1, $2)
    RETURNING id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  const result = await pool.query<SessionRecord>(query, [userId, title || 'New Chat']);
  return result.rows[0];
}

export async function listSessions({
  userId,
  limit,
  offset
}: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ items: SessionRecord[]; total: number }> {
  const result = await pool.query<SessionRecord>(
    `
    SELECT id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM chat_sessions
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  const countResult = await pool.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM chat_sessions WHERE user_id = $1',
    [userId]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total
  };
}

export async function renameSession(sessionId: string, title: string): Promise<SessionRecord> {
  const result = await pool.query<SessionRecord>(
    `
      UPDATE chat_sessions
      SET title = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [sessionId, title]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  return result.rows[0];
}

export async function setFavorite(sessionId: string, isFavorite: boolean): Promise<SessionRecord> {
  const result = await pool.query<SessionRecord>(
    `
      UPDATE chat_sessions
      SET is_favorite = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [sessionId, isFavorite]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  return result.rows[0];
}

export async function deleteSession(sessionId: string): Promise<void> {
  const result = await pool.query('DELETE FROM chat_sessions WHERE id = $1 RETURNING id', [sessionId]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }
}
