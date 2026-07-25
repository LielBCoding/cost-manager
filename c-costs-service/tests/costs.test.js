// costs.test.js
// Tests for the costs endpoints. The database is mocked so the tests run offline.
const request = require('supertest');
const express = require('express');

jest.mock('../models/cost.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
  CATEGORIES: ['food', 'health', 'housing', 'sports', 'education'],
}));
jest.mock('../models/user.model', () => ({ findOne: jest.fn() }));
jest.mock('../models/report.model', () => ({ findOne: jest.fn(), updateOne: jest.fn() }));
const Cost = require('../models/cost.model');
const User = require('../models/user.model');
const costsRouter = require('../routes/costs.routes');

const app = express();
app.use(express.json());
app.use('/api', costsRouter);

// current month, so the report is computed fresh (not read from cache)
const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

describe('Costs service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/add', () => {
    test('adds a new cost when the user exists', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 123123 }) });
      Cost.create.mockResolvedValue({ _id: 'x', description: 'test milk', category: 'food', userid: 123123, sum: 10, date: new Date() });
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'test milk', category: 'food', sum: 10 });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('category', 'food');
      expect(res.body).toHaveProperty('sum', 10);
    });

    test('rejects an invalid category', async () => {
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'x', category: 'toys', sum: 5 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('rejects a cost for a non-existent user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      const res = await request(app).post('/api/add').send({ userid: 999999, description: 'x', category: 'food', sum: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/report', () => {
    test('returns a report grouped by category with all five categories', async () => {
      Cost.find.mockReturnValue({ lean: () => Promise.resolve([{ category: 'food', sum: 10, description: 'test milk', date: new Date() }]) });
      const res = await request(app).get(`/api/report?id=123123&year=${YEAR}&month=${MONTH}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userid', 123123);
      const categories = res.body.costs.map((g) => Object.keys(g)[0]);
      for (const cat of ['food', 'health', 'housing', 'sports', 'education']) {
        expect(categories).toContain(cat);
      }
      const food = res.body.costs.find((g) => g.food).food;
      expect(food.some((c) => c.description === 'test milk')).toBe(true);
    });

    test('rejects a report request with missing parameters', async () => {
      const res = await request(app).get('/api/report');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});
