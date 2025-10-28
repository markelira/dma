export const trackError = (error: Error, context?: any) => {
  console.error('Error tracked:', error, context);
  // Integrate with error tracking service
}; 