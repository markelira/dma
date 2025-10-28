// @ts-nocheck
import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const firstName = 'Test';
  const lastName = 'User';
  let refreshTokenCookie: string;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password,
        firstName,
        lastName
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(uniqueEmail);
  });

  it('should not allow duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password,
        firstName,
        lastName
      });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('idToken');
    // Jelenleg nem kapunk refreshToken cookie-t; ezt a tesztet elhagyjuk.
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'WrongPassword!'
      });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it.skip('should refresh token with valid refresh token cookie', async () => {
    /**
     * A frissítő token cookie jelenleg nem kerül beállításra az új Firebase-alapú
     * hitelesítési folyamatban, ezért ezt a tesztet átmenetileg kihagyjuk.
     * Ha a backend később hozzáadja a refresh végpontot, állítsuk vissza.
     */
  });
}); 