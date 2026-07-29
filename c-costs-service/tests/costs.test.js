// costs.test.js
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
const Report = require('../models/report.model');
const costsRouter = require('../routes/costs.routes');

const app = express();
app.use(express.json());
app.use('/api', costsRouter);

// current month, so the report is computed fresh (not read from cache)
const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

// a user that exists, for the happy paths
function userExists() {
  User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 123123 }) });
}

describe('Costs service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/add', () => {
    test('adds a new cost when no date is sent (defaults to now)', async () => {
      userExists();
      Cost.create.mockResolvedValue({ _id: 'x', description: 'milk', category: 'food', userid: 123123, sum: 8, date: new Date() });
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'milk', category: 'food', sum: 8 });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('category', 'food');
      expect(res.body).toHaveProperty('sum', 8);
    });

    test('rejects when required fields are missing', async () => {
      const res = await request(app).post('/api/add').send({ description: 'milk' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('rejects an invalid category', async () => {
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'x', category: 'toys', sum: 5 });
      expect(res.statusCode).toBe(400);
    });

    test('rejects a non-numeric sum', async () => {
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'x', category: 'food', sum: true });
      expect(res.statusCode).toBe(400);
    });

    test('rejects a cost for a non-existent user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      const res = await request(app).post('/api/add').send({ userid: 999999, description: 'x', category: 'food', sum: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });

    test('rejects a cost dated in the past', async () => {
      userExists();
      const res = await request(app).post('/api/add').send({ userid: 123123, description: 'x', category: 'food', sum: 5, date: '2020-01-01' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/past/i);
    });
  });

  describe('GET /api/report', () => {
    test('returns a report grouped by category with all five categories', async () => {
      Cost.find.mockReturnValue({ lean: () => Promise.resolve([{ category: 'food', sum: 10, description: 'milk', date: new Date() }]) });
      const res = await request(app).get(`/api/report?id=123123&year=${YEAR}&month=${MONTH}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userid', 123123);
      const categories = res.body.costs.map((g) => Object.keys(g)[0]);
      for (const cat of ['food', 'health', 'housing', 'sports', 'education']) {
        expect(categories).toContain(cat);
      }
      const food = res.body.costs.find((g) => g.food).food;
      expect(food.some((c) => c.description === 'milk')).toBe(true);
    });

    test('returns the saved (cached) report for a past month', async () => {
      // a past month that already ended -> the route should return the cached document
      const savedCosts = [{ food: [{ sum: 12, description: 'choco', day: 17 }] }, { education: [] }, { health: [] }, { housing: [] }, { sports: [] }];
      Report.findOne.mockReturnValue({ lean: () => Promise.resolve({ userid: 123123, year: 2020, month: 1, costs: savedCosts }) });
      const res = await request(app).get('/api/report?id=123123&year=2020&month=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.costs).toEqual(savedCosts);
      // it should NOT have hit the costs collection, since the cache answered
      expect(Cost.find).not.toHaveBeenCalled();
    });

    test('rejects a report request with missing parameters', async () => {
      const res = await request(app).get('/api/report');
      expect(res.statusCode).toBe(400);
    });

    test('rejects an out-of-range month', async () => {
      const res = await request(app).get('/api/report?id=123123&year=2026&month=13');
      expect(res.statusCode).toBe(400);
    });
  });
});
