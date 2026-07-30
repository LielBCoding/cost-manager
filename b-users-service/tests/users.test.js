// users.test.js
const request = require('supertest');
const express = require('express');

jest.mock('../models/user.model', () => ({ findOne: jest.fn(), create: jest.fn(), find: jest.fn() }));
jest.mock('../models/cost.model', () => ({
  aggregate: jest.fn(),
  CATEGORIES: ['food', 'health', 'housing', 'sports', 'education'],
}));
const User = require('../models/user.model');
const Cost = require('../models/cost.model');
const usersRouter = require('../routes/users.routes');

const app = express();
app.use(express.json());
app.use('/api', usersRouter);

describe('Users service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/add', () => {
    test('adds a new user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      User.create.mockResolvedValue({ id: 900001, first_name: 'test', last_name: 'user', birthday: new Date('1990-01-01') });
      const res = await request(app).post('/api/add').send({ id: 900001, first_name: 'test', last_name: 'user', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 900001);
    });

    test('rejects a duplicate user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 900001 }) });
      const res = await request(app).post('/api/add').send({ id: 900001, first_name: 'a', last_name: 'b', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });

    test('rejects missing fields', async () => {
      const res = await request(app).post('/api/add').send({ id: 5 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('rejects a non-numeric id', async () => {
      const res = await request(app).post('/api/add').send({ id: 'abc', first_name: 'a', last_name: 'b', birthday: '1990-01-01' });
      expect(res.statusCode).toBe(400);
    });

    test('rejects an invalid birthday', async () => {
      const res = await request(app).post('/api/add').send({ id: 5, first_name: 'a', last_name: 'b', birthday: 'not-a-date' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/birthday/i);
    });
  });

  describe('GET /api/users', () => {
    test('returns an array of users', async () => {
      User.find.mockReturnValue({ lean: () => Promise.resolve([{ id: 1, first_name: 'a', last_name: 'b', birthday: new Date() }]) });
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    test('returns a 500 error document when the database fails', async () => {
      User.find.mockReturnValue({ lean: () => Promise.reject(new Error('DB fail')) });
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/users/:id', () => {
    test('returns the user details with a numeric total', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 123123, first_name: 'mosh', last_name: 'israeli' }) });
      Cost.aggregate.mockResolvedValue([{ total: 100 }]);
      const res = await request(app).get('/api/users/123123');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 123123);
      expect(res.body).toHaveProperty('total', 100);
    });

    test('returns total 0 for a user with no costs', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve({ id: 123123, first_name: 'mosh', last_name: 'israeli' }) });
      Cost.aggregate.mockResolvedValue([]);
      const res = await request(app).get('/api/users/123123');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total', 0);
    });

    test('returns 404 for a non-existent user', async () => {
      User.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
      const res = await request(app).get('/api/users/999999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });
  });
});
