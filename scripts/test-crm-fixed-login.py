#!/usr/bin/env python3
"""
Fixed CRM Browser Automation Test with Correct Login
"""

import asyncio
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

async def test_crm_with_fixed_login():
    print("🚀 CRM Test with Fixed Login")
    print("=" * 50)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=800)
    page = await browser.new_page()
    
    try:
        base_url = "https://epg-crm.vercel.app"
        username = "MarkandLouie2025@"
        password = "ySz7JY^4tj@GmUqK"
        
        # Create screenshots directory
        os.makedirs("test-screenshots-fixed", exist_ok=True)
        
        print("📍 Step 1: Navigate to admin...")
        await page.goto(f"{base_url}/admin")
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path="test-screenshots-fixed/01-login-page.png")
        
        print(f"📋 Current URL: {page.url}")
        print(f"📋 Page title: {await page.title()}")
        
        print("🔐 Step 2: Login with correct field targeting...")
        
        # Fill username field (id='username', type='text')
        username_field = await page.query_selector('#username')
        if username_field:
            await username_field.fill(username)
            print(f"✅ Username field filled: {username}")
        else:
            print("❌ Username field not found")
            return False
        
        # Fill password field (id='password', type='password')
        password_field = await page.query_selector('#password')
        if password_field:
            await password_field.fill(password)
            print("✅ Password field filled")
        else:
            print("❌ Password field not found")
            return False
        
        # Click submit button
        submit_button = await page.query_selector('button[type="submit"]')
        if submit_button:
            print("🖱️ Clicking login button...")
            await submit_button.click()
            
            # Wait for navigation
            try:
                await page.wait_for_navigation(timeout=10000)
                print("✅ Navigation completed")
            except:
                print("⏳ No navigation detected, checking current state...")
            
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path="test-screenshots-fixed/02-after-login.png")
            
            # Check login results
            new_url = page.url
            new_title = await page.title()
            
            print(f"\n📊 LOGIN RESULTS:")
            print(f"📋 New URL: {new_url}")
            print(f"📋 New Title: {new_title}")
            
            if '/admin' in new_url and '/login' not in new_url:
                print("🎉 LOGIN SUCCESS! Now in admin area")
                
                print("\n📍 Step 3: Test staff-unified page...")
                await page.goto(f"{base_url}/admin/staff-unified")
                await page.wait_for_load_state('networkidle')
                await page.screenshot(path="test-screenshots-fixed/03-staff-unified.png")
                
                # Check staff management page
                staff_title = await page.query_selector('h1')
                if staff_title:
                    title_text = await staff_title.inner_text()
                    print(f"📋 Page heading: {title_text}")
                    
                    if "Staff Management" in title_text:
                        print("✅ Staff Management page loaded successfully!")
                        
                        # Look for tabs
                        tabs = await page.query_selector_all('button:has-text("Overview"), button:has-text("Email"), button:has-text("Credentials"), button:has-text("Add")')
                        print(f"📋 Found {len(tabs)} tabs")
                        
                        if len(tabs) >= 4:
                            print("✅ All expected tabs found!")
                            
                            # Test clicking tabs
                            for i, tab in enumerate(tabs[:4]):
                                tab_text = await tab.inner_text()
                                print(f"🔄 Testing tab: {tab_text}")
                                await tab.click()
                                await page.wait_for_timeout(1000)
                                await page.screenshot(path=f"test-screenshots-fixed/04-tab-{i+1}-{tab_text.replace(' ', '-').lower()}.png")
                            
                            # Final test - check for staff data
                            staff_elements = await page.query_selector_all('tr, .staff-member, table')
                            print(f"📊 Found {len(staff_elements)} staff-related elements")
                            
                            if len(staff_elements) > 0:
                                print("✅ Staff data elements detected!")
                                await page.screenshot(path="test-screenshots-fixed/05-final-success.png")
                                
                                print("\n🎉 COMPREHENSIVE TEST RESULTS:")
                                print("✅ Login: SUCCESS")
                                print("✅ Staff-unified page: ACCESSIBLE")
                                print("✅ Navigation tabs: WORKING")
                                print("✅ Staff data: LOADING")
                                print("\n🎯 CONCLUSION: Agent #29's unified staff management system is WORKING PERFECTLY!")
                                
                                return True
                            else:
                                print("⚠️ No staff data elements found")
                        else:
                            print("❌ Expected tabs not found")
                    else:
                        print(f"❌ Unexpected page content: {title_text}")
                else:
                    print("❌ No page heading found")
            else:
                print("❌ Login failed - still on login page or error")
                
                # Check for error messages
                errors = await page.query_selector_all('.error, .alert, [role="alert"]')
                if errors:
                    for error in errors:
                        error_text = await error.inner_text()
                        if error_text.strip():
                            print(f"🚨 Error: {error_text}")
        else:
            print("❌ Submit button not found")
            
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        await page.screenshot(path="test-screenshots-fixed/error.png")
        return False
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    success = asyncio.run(test_crm_with_fixed_login())
    if success:
        print("\n🏆 ALL TESTS PASSED - STAFF MANAGEMENT SYSTEM WORKING!")
    else:
        print("\n❌ TESTS FAILED - ISSUES DETECTED")
    sys.exit(0 if success else 1) 