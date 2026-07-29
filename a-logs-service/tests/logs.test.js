// logs.test.js
const request = require('supertest');
const express = require('express');

jest.mock('../models/log.model', () => ({ find: jest.fn() }));
const Log = require('../models/log.model');
const logsRouter = require('../routes/logs.routes');

const app = express();
app.use(express.json());
app.use('/api', logsRouter);

// builds the find().sort().lean() chain the route uses
function mockLogsChain(result) {
  Log.find.mockReturnValue({ sort: () => ({ lean: () => result }) });
}

describe('GET /api/logs', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 and an array of logs', async () => {
    mockLogsChain(Promise.resolve([{ _id: '1', msg: 'a' }, { _id: '2', msg: 'b' }]));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test('returns an empty array when there are no logs', async () => {
    mockLogsChain(Promise.resolve([]));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns a 500 error document on a database failure', async () => {
    mockLogsChain(Promise.reject(new Error('DB fail')));
    const res = await request(app).get('/api/logs');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('message');
  });
});
