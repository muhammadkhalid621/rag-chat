import assert from 'node:assert/strict';
import test from 'node:test';
import { getPagination } from '../src/utils/pagination';

test('getPagination applies defaults', () => {
  const result = getPagination({});

  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.offset, 0);
});

test('getPagination normalizes invalid values', () => {
  const result = getPagination({ page: '-2', limit: '1000' });

  assert.equal(result.page, 1);
  assert.equal(result.limit, 100);
  assert.equal(result.offset, 0);
});

test('getPagination computes offset correctly', () => {
  const result = getPagination({ page: '3', limit: '15' });

  assert.equal(result.page, 3);
  assert.equal(result.limit, 15);
  assert.equal(result.offset, 30);
});
