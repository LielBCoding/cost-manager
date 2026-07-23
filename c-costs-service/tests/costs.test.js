// costs.test.js
// Unit tests for the Costs service (add cost, monthly report).
// The database is mocked, so these tests run offline without a real MongoDB
// connection or a .env file.
const request = require('supertest');

// Mock the models so that no real database is touched
jest.mock('../models/cost.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
  CATEGORIES: ['food', 'health', 'housing', 'sports', 'education'],
}));
jest.mock('../models/user.model', () => ({ findOne: jest.fn() }));
jest.mock('../models/report.model', () => ({ findOne: jest.fn(), updateOne: jest.fn() }));
const Cost = require('../models/cost.model');
const User = require('../models/user.model');
const app = require('../app');

// Use the current month so the report is computed fresh (not read from cache)
const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

describe('Costs service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/add', () => {
    // A valid cost for an existing user should be created and echoed back
    test('adds a new cost (201) when the user exists', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 123123 }) });
      Cost.create.mockResolvedValue({
        _id: 'x', description: 'test milk', category: 'food', userid: 123123, sum: 10, date: new Date(),
      });
      const res = await request(app)
        .post('/api/add')
        .send({ userid: 123123, description: 'test milk', category: 'food', sum: 10 });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('category', 'food');
      expect(res.body).toHaveProperty('sum', 10);
    });

    // An unsupported category must fail validation
    test('rejects an invalid category (400)', async () => {
      const res = await request(app)
        .post('/api/add')
        .send({ userid: 123123, description: 'x', category: 'toys', sum: 5 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    // A cost cannot be added for a user that does not exist
    test('rejects a cost for a non-existent user (404)', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      const res = await request(app)
        .post('/api/add')
        .send({ userid: 999999, description: 'x', category: 'food', sum: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/report', () => {
    // The report must be grouped and contain all five categories
    test('returns a grouped report with all five categories (200)', async () => {
      Cost.find.mockReturnValue({
        lean: () => Promise.resolve([
          { category: 'food', sum: 10, description: 'test milk', date: new Date() },
        ]),
      });
      const res = await request(app).get(`/api/report?id=123123&year=${YEAR}&month=${MONTH}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userid', 123123);
      expect(Array.isArray(res.body.costs)).toBe(true);

      // Collect the category names that appear in the report
      const categories = res.body.costs.map((group) => Object.keys(group)[0]);
      for (const cat of ['food', 'health', 'housing', 'sports', 'education']) {
        expect(categories).toContain(cat);
      }

      // The mocked cost should appear under "food"
      const food = res.body.costs.find((g) => g.food).food;
      expect(food.some((c) => c.description === 'test milk')).toBe(true);
    });

    // Missing query parameters must fail validation
    test('rejects a report request with missing parameters (400)', async () => {
      const res = await request(app).get('/api/report');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});
