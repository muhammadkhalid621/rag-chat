const { pool } = require('../db/pool');
const { AppError } = require('../utils/errors');

async function createSession({ userId, title }) {
  const query = `
    INSERT INTO chat_sessions (user_id, title)
    VALUES ($1, $2)
    RETURNING id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  const result = await pool.query(query, [userId, title || 'New Chat']);
  return result.rows[0];
}

async function listSessions({ userId, limit, offset }) {
  const result = await pool.query(
    `
    SELECT id, user_id AS "userId", title, is_favorite AS "isFavorite", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM chat_sessions
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM chat_sessions WHERE user_id = $1', [
    userId
  ]);

  return {
    items: result.rows,
    total: countResult.rows[0].total
  };
}

async function ensureSessionExists(sessionId) {
  const result = await pool.query('SELECT id FROM chat_sessions WHERE id = $1', [sessionId]);
  if (result.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }
}

async function renameSession(sessionId, title) {
  const result = await pool.query(
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

async function setFavorite(sessionId, isFavorite) {
  const result = await pool.query(
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

async function deleteSession(sessionId) {
  const result = await pool.query('DELETE FROM chat_sessions WHERE id = $1 RETURNING id', [sessionId]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }
}

module.exports = {
  createSession,
  listSessions,
  ensureSessionExists,
  renameSession,
  setFavorite,
  deleteSession
};
