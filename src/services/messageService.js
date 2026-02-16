const { pool } = require('../db/pool');
const { AppError } = require('../utils/errors');

async function createMessage(sessionId, { sender, content, retrievedContext }) {
  const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id = $1', [sessionId]);
  if (sessionCheck.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  const query = `
    INSERT INTO chat_messages (session_id, sender, content, retrieved_context)
    VALUES ($1, $2, $3, $4)
    RETURNING id, session_id AS "sessionId", sender, content, retrieved_context AS "retrievedContext", created_at AS "createdAt"
  `;

  const result = await pool.query(query, [sessionId, sender, content, retrievedContext || null]);

  await pool.query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1', [sessionId]);

  return result.rows[0];
}

async function listMessages(sessionId, { limit, offset }) {
  const sessionCheck = await pool.query('SELECT id FROM chat_sessions WHERE id = $1', [sessionId]);
  if (sessionCheck.rowCount === 0) {
    throw new AppError(404, 'Session not found');
  }

  const result = await pool.query(
    `
    SELECT id, session_id AS "sessionId", sender, content, retrieved_context AS "retrievedContext", created_at AS "createdAt"
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC
    LIMIT $2 OFFSET $3
    `,
    [sessionId, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM chat_messages WHERE session_id = $1',
    [sessionId]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total
  };
}

module.exports = { createMessage, listMessages };
