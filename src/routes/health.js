const express = require('express');
const { pool } = require('../db/pool');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  })
);

module.exports = { healthRouter: router };
