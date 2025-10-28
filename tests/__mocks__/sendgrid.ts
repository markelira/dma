// Mock for @sendgrid/mail package
export const mockSend = jest.fn();
export const mockSetApiKey = jest.fn();

const mockSgMail = {
  send: mockSend,
  setApiKey: mockSetApiKey,
};

export default mockSgMail;

// Reset function for tests
export const resetSendGridMocks = () => {
  mockSend.mockReset();
  mockSetApiKey.mockReset();
};

// Helper to simulate SendGrid responses
export const mockSendGridSuccess = () => {
  mockSend.mockResolvedValue([{
    statusCode: 202,
    body: {},
    headers: {}
  }, {}]);
};

export const mockSendGridError = (error: string | Error) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  mockSend.mockRejectedValue(errorObj);
};

// Simulate different SendGrid error types
export const mockSendGridApiError = (statusCode: number, message: string) => {
  const error = new Error(message) as any;
  error.code = statusCode;
  error.response = {
    status: statusCode,
    statusText: message,
    body: { errors: [{ message }] }
  };
  mockSend.mockRejectedValue(error);
};

export const mockSendGridRateLimit = () => {
  mockSendGridApiError(429, 'Rate limit exceeded');
};

export const mockSendGridInvalidEmail = () => {
  mockSendGridApiError(400, 'Invalid email address');
};

export const mockSendGridUnauthorized = () => {
  mockSendGridApiError(401, 'Unauthorized');
};