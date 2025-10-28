import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for email testing...');
  
  try {
    // Start browser for any pre-test setup
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server to be ready...');
    
    let retries = 30; // 30 seconds
    while (retries > 0) {
      try {
        const response = await page.goto('http://localhost:3000', { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        });
        
        if (response && response.ok()) {
          console.log('✅ Dev server is ready!');
          break;
        }
      } catch (error) {
        console.log(`⏳ Dev server not ready yet, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    if (retries === 0) {
      console.warn('⚠️ Dev server may not be fully ready, but proceeding with tests...');
    }
    
    // Check for Firebase emulators
    try {
      await page.goto('http://localhost:4000', { timeout: 5000 }); // Firebase UI
      console.log('✅ Firebase emulators detected');
    } catch (error) {
      console.log('ℹ️ Firebase emulators not detected (may be expected in CI)');
    }
    
    await browser.close();
    
    // Set up environment variables for testing
    process.env.PLAYWRIGHT_TEST_ENV = 'true';
    process.env.NODE_ENV = 'test';
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;