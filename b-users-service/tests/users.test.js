// users.test.js
// Unit tests for the Users service (add user, list users, user details).
// The database is mocked, so these tests run offline without a real MongoDB
// connection or a .env file.
const request = require('supertest');

// Mock the models so that no real database is touched
jest.mock('../models/user.model', () => ({ findOne: jest.fn(), create: jest.fn(), find: jest.fn() }));
jest.mock('../models/cost.model', () => ({
  aggregate: jest.fn(),
  CATEGORIES: ['food', 'health', 'housing', 'sports', 'education'],
}));
const User = require('../models/user.model');
const Cost = require('../models/cost.model');
const app = require('../app');

describe('Users service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/add', () => {
    // A valid, non-existing user should be created and echoed back
    test('adds a new user (201)', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      User.create.mockResolvedValue({
        id: 900001, first_name: 'test', last_name: 'user', birthday: new Date('1990-01-01'),
      });
      const res = await request(app)
        .post('/api/add')
        .send({ id: 900001, first_name: 'test', last_name: 'user', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 900001);
      expect(res.body).toHaveProperty('first_name', 'test');
    });

    // The same user cannot be added twice
    test('rejects a duplicate user (409) with id and message', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 900001 }) });
      const res = await request(app)
        .post('/api/add')
        .send({ id: 900001, first_name: 'a', last_name: 'b', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });

    // Missing required fields must fail validation
    test('rejects missing fields (400)', async () => {
      const res = await request(app).post('/api/add').send({ id: 5 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    // A non-numeric id must fail validation
    test('rejects a non-numeric id (400)', async () => {
      const res = await request(app)
        .post('/api/add')
        .send({ id: 'abc', first_name: 'a', last_name: 'b', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/users', () => {
    // The list of users should be returned as an array
    test('returns an array of users (200)', async () => {
      User.find.mockReturnValue({
        lean: () => Promise.resolve([{ id: 1, first_name: 'a', last_name: 'b', birthday: new Date() }]),
      });
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/users/:id', () => {
    // Details of an existing user must include first_name, last_name, id and total
    test('returns the user details with a numeric total (200)', async () => {
      User.findOne.mockReturnValue({
        lean: () => Promise.resolve({ id: 123123, first_name: 'mosh', last_name: 'israeli' }),
      });
      Cost.aggregate.mockResolvedValue([{ total: 100 }]);
      const res = await request(app).get('/api/users/123123');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 123123);
      expect(res.body).toHaveProperty('first_name', 'mosh');
      expect(res.body).toHaveProperty('total', 100);
    });

    // A non-existent user must return an error document
    test('returns 404 for a non-existent user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      const res = await request(app).get('/api/users/999999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });
  });
});
