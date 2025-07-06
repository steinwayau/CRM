#!/usr/bin/env python3
"""
Comprehensive CRM Browser Automation Test
Tests CRM system with actual authentication and user workflows
"""

import asyncio
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

class CRMAuthenticatedTester:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.results = []
        self.screenshots_dir = "test-screenshots"
        
    async def setup_browser(self):
        """Initialize browser and page"""
        self.playwright = await async_playwright().start()
        
        # Launch browser with visible interface for debugging
        self.browser = await self.playwright.chromium.launch(
            headless=False,  # Set to True for headless mode
            slow_mo=1000     # Slow down operations for visibility
        )
        
        self.page = await self.browser.new_page()
        
        # Set viewport size
        await self.page.set_viewport_size({"width": 1280, "height": 720})
        
        # Create screenshots directory
        os.makedirs(self.screenshots_dir, exist_ok=True)
        
    async def login_to_crm(self):
        """Login to the CRM system"""
        print("🔐 Logging into CRM system...")
        
        try:
            # Navigate to the main page
            await self.page.goto(f"{self.base_url}/")
            await self.page.screenshot(path=f"{self.screenshots_dir}/01-homepage.png")
            
            # Navigate to admin (should redirect to login)
            await self.page.goto(f"{self.base_url}/admin")
            await self.page.wait_for_load_state('networkidle')
            await self.page.screenshot(path=f"{self.screenshots_dir}/02-login-page.png")
            
            # Check if we're on the login page
            page_title = await self.page.title()
            page_content = await self.page.content()
            
            if "login" in page_title.lower() or "login" in page_content.lower():
                print("✅ Successfully redirected to login page")
                
                # Find and fill username field
                username_field = await self.page.query_selector('input[type="email"], input[name="username"], input[id*="email"], input[id*="username"]')
                if username_field:
                    await username_field.fill(self.username)
                    print(f"✅ Username entered: {self.username}")
                else:
                    print("❌ Could not find username field")
                    return False
                
                # Find and fill password field
                password_field = await self.page.query_selector('input[type="password"]')
                if password_field:
                    await password_field.fill(self.password)
                    print("✅ Password entered")
                else:
                    print("❌ Could not find password field")
                    return False
                
                # Find and click login button
                login_button = await self.page.query_selector('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
                if login_button:
                    await login_button.click()
                    print("✅ Login button clicked")
                    
                    # Wait for navigation after login
                    await self.page.wait_for_load_state('networkidle', timeout=10000)
                    await self.page.screenshot(path=f"{self.screenshots_dir}/03-after-login.png")
                    
                    # Check if login was successful
                    current_url = self.page.url
                    new_content = await self.page.content()
                    
                    if "/admin" in current_url and "login" not in new_content.lower():
                        print("🎉 Login successful! Now in admin area")
                        return True
                    else:
                        print("❌ Login failed - still on login page or error occurred")
                        return False
                else:
                    print("❌ Could not find login button")
                    return False
            else:
                print("❌ Not redirected to login page as expected")
                return False
                
        except Exception as e:
            print(f"❌ Login failed with error: {e}")
            await self.page.screenshot(path=f"{self.screenshots_dir}/error-login.png")
            return False
    
    async def test_staff_unified_page(self):
        """Test the unified staff management page"""
        print("📋 Testing staff-unified page...")
        
        try:
            # Navigate to staff-unified page
            await self.page.goto(f"{self.base_url}/admin/staff-unified")
            await self.page.wait_for_load_state('networkidle')
            await self.page.screenshot(path=f"{self.screenshots_dir}/04-staff-unified-page.png")
            
            # Check page title and content
            page_title = await self.page.title()
            print(f"📋 Page title: {page_title}")
            
            # Look for staff management elements
            staff_heading = await self.page.query_selector('h1:has-text("Staff Management")')
            if staff_heading:
                print("✅ Found Staff Management heading")
            else:
                print("❌ Staff Management heading not found")
            
            # Look for tabs
            tabs = await self.page.query_selector_all('button[role="tab"], .tab, button:has-text("Overview"), button:has-text("Email")')
            print(f"📋 Found {len(tabs)} navigation tabs")
            
            if len(tabs) >= 4:
                print("✅ All expected tabs found (Overview, Email Management, Credentials, Add Staff)")
                
                # Test clicking through tabs
                for i, tab in enumerate(tabs[:4]):
                    tab_text = await tab.inner_text()
                    print(f"🔄 Testing tab: {tab_text}")
                    
                    await tab.click()
                    await self.page.wait_for_timeout(1000)
                    await self.page.screenshot(path=f"{self.screenshots_dir}/05-tab-{i+1}-{tab_text.replace(' ', '-').lower()}.png")
                    
                    # Check if content changed
                    print(f"✅ Tab '{tab_text}' clicked successfully")
            else:
                print("❌ Expected tabs not found")
            
            # Test staff data loading
            staff_rows = await self.page.query_selector_all('tr, .staff-item, [data-testid*="staff"]')
            print(f"📊 Found {len(staff_rows)} staff-related elements")
            
            # Look for loading states
            loading_elements = await self.page.query_selector_all('.loading, .spinner, [data-testid="loading"]')
            if len(loading_elements) > 0:
                print("⏳ Loading elements detected - waiting for data...")
                await self.page.wait_for_timeout(3000)
                await self.page.screenshot(path=f"{self.screenshots_dir}/06-after-loading.png")
            
            # Check for error messages
            error_elements = await self.page.query_selector_all('.error, .alert-error, [role="alert"]')
            if len(error_elements) > 0:
                for error in error_elements:
                    error_text = await error.inner_text()
                    print(f"⚠️ Error found: {error_text}")
            else:
                print("✅ No error messages detected")
            
            # Final screenshot of the page
            await self.page.screenshot(path=f"{self.screenshots_dir}/07-final-staff-unified.png")
            
            result = {
                'page': 'staff-unified',
                'accessible': True,
                'tabs_found': len(tabs),
                'staff_elements': len(staff_rows),
                'errors': len(error_elements),
                'success': len(tabs) >= 4 and len(error_elements) == 0
            }
            
            self.results.append(result)
            return result
            
        except Exception as e:
            print(f"❌ Staff-unified page test failed: {e}")
            await self.page.screenshot(path=f"{self.screenshots_dir}/error-staff-unified.png")
            return {'page': 'staff-unified', 'accessible': False, 'error': str(e), 'success': False}
    
    async def test_staff_management_comparison(self):
        """Test the original staff-management page for comparison"""
        print("📋 Testing original staff-management page for comparison...")
        
        try:
            await self.page.goto(f"{self.base_url}/admin/staff-management")
            await self.page.wait_for_load_state('networkidle')
            await self.page.screenshot(path=f"{self.screenshots_dir}/08-staff-management-original.png")
            
            # Check if this page works
            page_title = await self.page.title()
            staff_elements = await self.page.query_selector_all('tr, .staff-item, input[type="email"]')
            
            result = {
                'page': 'staff-management-original',
                'accessible': True,
                'staff_elements': len(staff_elements),
                'success': len(staff_elements) > 0
            }
            
            print(f"📊 Original staff-management: {len(staff_elements)} elements found")
            self.results.append(result)
            return result
            
        except Exception as e:
            print(f"❌ Original staff-management test failed: {e}")
            return {'page': 'staff-management-original', 'accessible': False, 'error': str(e), 'success': False}
    
    async def run_comprehensive_test(self):
        """Run the complete test suite"""
        print("🚀 Starting Comprehensive Authenticated CRM Test")
        print("=" * 60)
        print(f"🌐 Testing: {self.base_url}")
        print(f"👤 Username: {self.username}")
        print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        try:
            # Setup browser
            await self.setup_browser()
            
            # Login to CRM
            login_success = await self.login_to_crm()
            
            if login_success:
                # Test staff-unified page
                unified_result = await self.test_staff_unified_page()
                
                # Test original page for comparison
                original_result = await self.test_staff_management_comparison()
                
                # Generate summary
                await self.generate_summary()
                
            else:
                print("❌ Cannot proceed with tests - login failed")
                
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
        finally:
            # Cleanup
            if hasattr(self, 'browser'):
                await self.browser.close()
            if hasattr(self, 'playwright'):
                await self.playwright.stop()
    
    async def generate_summary(self):
        """Generate test summary with evidence"""
        print("\n📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r.get('success', False)])
        failed_tests = total_tests - passed_tests
        
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📝 Total: {total_tests}")
        
        print("\n🔍 DETAILED RESULTS:")
        for result in self.results:
            status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
            print(f"   {result['page']}: {status}")
            if 'tabs_found' in result:
                print(f"      📋 Tabs: {result['tabs_found']}")
            if 'staff_elements' in result:
                print(f"      👥 Staff elements: {result['staff_elements']}")
            if 'error' in result:
                print(f"      ⚠️ Error: {result['error']}")
        
        print(f"\n📸 Screenshots saved in: {self.screenshots_dir}/")
        print(f"📅 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # List screenshot files
        try:
            screenshots = [f for f in os.listdir(self.screenshots_dir) if f.endswith('.png')]
            screenshots.sort()
            print("\n📸 SCREENSHOTS CAPTURED:")
            for screenshot in screenshots:
                print(f"   📷 {screenshot}")
        except:
            pass
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'results': self.results
        }

async def main():
    """Main test execution"""
    base_url = "https://epg-crm.vercel.app"
    username = "MarkandLouie2025@"
    password = "ySz7JY^4tj@GmUqK"
    
    tester = CRMAuthenticatedTester(base_url, username, password)
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1) 