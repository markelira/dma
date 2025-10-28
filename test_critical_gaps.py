import asyncio
from playwright.async_api import async_playwright

async def test_elira_critical_gaps():
    """Test ELIRA platform for critical production blockers"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        results = []
        
        # Test 1: Check if the application is running
        try:
            await page.goto('http://localhost:3000', wait_until='networkidle')
            results.append("✅ Application is running on localhost:3000")
        except Exception as e:
            results.append(f"❌ Application not accessible: {str(e)}")
            await browser.close()
            return results
        
        # Test 2: Check homepage loading
        try:
            await page.wait_for_selector('text=ELIRA', timeout=5000)
            results.append("✅ Homepage loads with ELIRA branding")
        except:
            results.append("❌ Homepage missing ELIRA branding")
        
        # Test 3: Check if courses are displayed
        try:
            await page.goto('http://localhost:3000/courses', wait_until='networkidle')
            await page.wait_for_selector('[data-testid="course-card"], .course-card, [class*="CourseCard"]', timeout=5000)
            results.append("✅ Course cards are displayed")
        except:
            # Check for any course-related content
            course_content = await page.locator('text=/.*kurzus.*/i').count()
            if course_content > 0:
                results.append("⚠️ Course page loads but no course cards found")
            else:
                results.append("❌ Course cards not found - CourseCard component missing")
        
        # Test 4: Check authentication - try to access dashboard
        try:
            await page.goto('http://localhost:3000/dashboard', wait_until='networkidle')
            # Check if redirected to login
            if 'login' in page.url or 'bejelentkezés' in await page.content().lower():
                results.append("✅ Authentication redirect works")
            else:
                # Check if dashboard loads
                dashboard_content = await page.locator('text=/.*dashboard.*/i').count()
                if dashboard_content > 0:
                    results.append("⚠️ Dashboard accessible without authentication")
                else:
                    results.append("❌ Dashboard behavior unclear")
        except Exception as e:
            results.append(f"❌ Dashboard access error: {str(e)}")
        
        # Test 5: Check login page
        try:
            await page.goto('http://localhost:3000/login', wait_until='networkidle')
            login_form = await page.locator('input[type="email"], input[type="password"]').count()
            if login_form >= 2:
                results.append("✅ Login form exists")
            else:
                results.append("❌ Login form incomplete")
        except:
            results.append("❌ Login page not accessible")
        
        # Test 6: Check for payment integration
        try:
            # Look for Stripe or payment-related scripts
            stripe_loaded = await page.evaluate('''() => {
                return typeof window.Stripe !== 'undefined' || 
                       document.querySelector('script[src*="stripe"]') !== null;
            }''')
            if stripe_loaded:
                results.append("⚠️ Stripe script loaded but payment disabled in backend")
            else:
                results.append("❌ No payment integration found in frontend")
        except:
            results.append("❌ Could not check payment integration")
        
        # Test 7: Test course detail page
        try:
            # Try to find and click on first course
            await page.goto('http://localhost:3000/courses', wait_until='networkidle')
            first_course = await page.locator('a[href*="/courses/"]').first
            if await first_course.count() > 0:
                await first_course.click()
                await page.wait_for_load_state('networkidle')
                
                # Check for enrollment button
                enrollment_button = await page.locator('button:has-text("Jelentkezzen"), button:has-text("Vásárlás"), button:has-text("Tanulás")').count()
                if enrollment_button > 0:
                    results.append("✅ Course detail page has action buttons")
                else:
                    results.append("❌ Course detail page missing action buttons")
            else:
                results.append("❌ No course links found")
        except:
            results.append("❌ Could not test course detail page")
        
        # Test 8: Check for settings functionality
        try:
            await page.goto('http://localhost:3000/dashboard/settings', wait_until='networkidle')
            settings_form = await page.locator('input, textarea, select').count()
            if settings_form > 0:
                save_button = await page.locator('button:has-text("Beállítások mentése")').count()
                if save_button > 0:
                    results.append("⚠️ Settings UI exists but backend not implemented")
                else:
                    results.append("❌ Settings page incomplete")
            else:
                results.append("❌ Settings page not accessible or empty")
        except:
            results.append("❌ Could not access settings page")
        
        await browser.close()
        return results

# Run the test
async def main():
    results = await test_elira_critical_gaps()
    print("\n=== ELIRA CRITICAL GAPS TEST RESULTS ===\n")
    for result in results:
        print(result)
    print("\n=========================================\n")

if __name__ == "__main__":
    asyncio.run(main())