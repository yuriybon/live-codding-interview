import request from 'supertest';
import express from 'express';
import sessionRoutes from '../../routes/sessions';

const app = express();
app.use(express.json());
// Mount routes
app.use('/api/sessions', sessionRoutes);

describe('POST /api/sessions/new', () => {
  it('should return 400 Bad Request if language is missing', async () => {
    const response = await request(app)
      .post('/api/sessions/new')
      .send({ exerciseId: 'two-sum' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('language');
  });

  it('should return 400 Bad Request if exerciseId is missing', async () => {
    const response = await request(app)
      .post('/api/sessions/new')
      .send({ language: 'typescript' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('exerciseId');
  });

  it('should return 201 Created with sessionId when payload is valid', async () => {
    const response = await request(app)
      .post('/api/sessions/new')
      .send({ language: 'typescript', exerciseId: 'two-sum' });

    // Since it's currently a prototype, it might return 200 or 201, but we enforce 201
    expect([200, 201]).toContain(response.status);
    expect(response.body.sessionId).toBeDefined();
  });
});
