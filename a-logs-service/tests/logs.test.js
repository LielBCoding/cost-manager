// logs.test.js
// Unit tests for the Logs (admin) service.
// The database is mocked, so these tests run offline without a real MongoDB
// connection or a .env file.
const request = require('supertest');

// Mock the Log model so that no real database is touched
jest.mock('../models/log.model', () => ({ find: jest.fn() }));
const Log = require('../models/log.model');
const app = require('../app');

// Builds the find().sort().lean() chain that the route uses
function mockLogsChain(result) {
  Log.find.mockReturnValue({ sort: () => ({ lean: () => result }) });
}

describe('GET /api/logs', () => {
  beforeEach(() => jest.clearAllMocks());

  // A normal request should return the logs as a JSON array
  test('returns 200 and an array of logs', async () => {
    mockLogsChain(Promise.resolve([{ _id: '1', msg: 'a' }, { _id: '2', msg: 'b' }]));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  // When there are no logs, an empty array is returned
  test('returns an empty array when there are no logs', async () => {
    mockLogsChain(Promise.resolve([]));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  // A database failure must return an error document with id and message
  test('returns a 500 error document on a database failure', async () => {
    mockLogsChain(Promise.reject(new Error('DB fail')));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('message');
  });
});
