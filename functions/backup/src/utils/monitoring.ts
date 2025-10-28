export const monitorFunction = (fn: Function) => {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      console.log(`✅ Function completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Function failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  };
}; 