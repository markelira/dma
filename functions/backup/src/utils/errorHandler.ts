export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: any) => {
  console.error('❌ Error:', error);
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  return {
    success: false,
    error: 'Ismeretlen hiba történt',
    statusCode: 500
  };
}; 