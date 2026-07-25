// about.test.js
// Tests for the about (developers team) endpoint.
const request = require('supertest');
const express = require('express');
const aboutRouter = require('../routes/about.routes');

const app = express();
app.use(express.json());
app.use('/api', aboutRouter);

describe('GET /api/about', () => {
  test('returns 200 and an array of team members', async () => {
    const res = await request(app).get('/api/about');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('every member has only first_name and last_name', async () => {
    const res = await request(app).get('/api/about');
    for (const member of res.body) {
      expect(Object.keys(member).sort()).toEqual(['first_name', 'last_name']);
    }
  });
});
