// about.test.js
// Unit tests for the About (developers team) service.
require('dotenv').config();
const request = require('supertest');
const app = require('../app');

// Network / DB logging may be slow on the first call
jest.setTimeout(30000);

describe('GET /api/about', () => {
  // The endpoint should return the list of team members
  test('returns 200 and an array of team members', async () => {
    const res = await request(app).get('/api/about');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Each member must expose ONLY first_name and last_name - no extra data
  test('every member has only first_name and last_name', async () => {
    const res = await request(app).get('/api/about');
    for (const member of res.body) {
      expect(Object.keys(member).sort()).toEqual(['first_name', 'last_name']);
      expect(typeof member.first_name).toBe('string');
      expect(typeof member.last_name).toBe('string');
    }
  });
});
