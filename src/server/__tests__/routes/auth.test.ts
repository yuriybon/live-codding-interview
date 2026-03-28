import request from 'supertest';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import authRoutes from '../../routes/auth';

// Mock the google-auth-library module
jest.mock('google-auth-library');

// Mock authService to avoid real JWT generation
jest.mock('../../services/auth', () => ({
  authService: {
    extractUserProfile: jest.fn().mockReturnValue({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
    }),
    generateSessionToken: jest.fn().mockReturnValue('mock-jwt-token'),
  },
}));

describe('GET /auth/google/callback', () => {
  let app: express.Express;
  let mockGetToken: jest.Mock;
  let mockSetCredentials: jest.Mock;
  let mockVerifyIdToken: jest.Mock;
  
  beforeEach(() => {
    app = express();
    // Mount the auth routes to match how they would be in production
    app.use('/auth', authRoutes);

    // Provide a mocked implementation for OAuth2Client
    mockGetToken = jest.fn();
    mockSetCredentials = jest.fn();
    mockVerifyIdToken = jest.fn();
    
    (OAuth2Client as unknown as jest.Mock).mockImplementation(() => {
      return {
        getToken: mockGetToken,
        setCredentials: mockSetCredentials,
        verifyIdToken: mockVerifyIdToken,
      };
    });
    
    // Suppress console.error in tests to keep output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockRestore();
  });

  it('should handle OAuth2Client.getToken() rejecting securely and safely', async () => {
    // Arrange: the code to be passed to getToken
    const invalidAuthCode = 'invalid_authorization_code';

    // Make getToken throw an error as it would for a misconfiguration or bad code
    const mockError = new Error('invalid_grant');
    mockGetToken.mockRejectedValue(mockError);

    // Act: Send request to the callback endpoint
    const response = await request(app).get(`/auth/google/callback?code=${invalidAuthCode}`);

    // Assert: The route should call getToken with the code
    expect(mockGetToken).toHaveBeenCalledWith(invalidAuthCode);

    // Ensure the server did not crash and redirected to frontend with an error
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/error=invalid_grant/);
  });
  
  it('should successfully exchange a valid code for tokens, create a session, and redirect', async () => {
    const validAuthCode = 'valid_code';
    
    // Mock the token response
    mockGetToken.mockResolvedValue({
      tokens: { id_token: 'mock_id_token' }
    });
    
    // Mock verifyIdToken response to return a mock ticket
    const mockTicket = {
      getPayload: jest.fn().mockReturnValue({ sub: '123', email: 'test@example.com' })
    };
    mockVerifyIdToken.mockResolvedValue(mockTicket);
    
    // Act
    const response = await request(app).get(`/auth/google/callback?code=${validAuthCode}`);
    
    // Assert
    expect(mockGetToken).toHaveBeenCalledWith(validAuthCode);
    expect(mockVerifyIdToken).toHaveBeenCalledWith(expect.objectContaining({
      idToken: 'mock_id_token'
    }));
    
    // Check if the cookie was set
    const setCookieHeader = response.headers['set-cookie'];
    // Ensure setCookieHeader is an array before calling .some()
    const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader].filter(Boolean);
    
    expect(cookiesArray.some((header: string) => header.includes('session_token=mock-jwt-token'))).toBe(true);
    
    // Check if it redirected to the frontend URL
    expect(response.status).toBe(302);
    expect(response.headers.location).not.toMatch(/error=/);
  });
});
