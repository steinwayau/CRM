#!/usr/bin/env python3
"""
Test the staff-test route to see if renaming fixed the issue
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def test_staff_test_route():
    print("🎯 TESTING: staff-test route")
    print("=" * 50)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=800)
    page = await browser.new_page()
    
    try:
        base_url = "https://epg-crm.vercel.app"
        username = "MarkandLouie2025@"
        password = "ySz7JY^4tj@GmUqK"
        
        # Step 1: Login
        print("🔐 Step 1: Login to CRM...")
        await page.goto(f"{base_url}/login")
        await page.wait_for_load_state('networkidle')
        
        await page.fill('#username', username)
        await page.fill('#password', password)
        
        # Wait for login response
        async with page.expect_response(lambda response: '/api/auth/login' in response.url) as response_info:
            await page.click('button[type="submit"]')
            response = await response_info.value
            
        response_data = await response.json()
        
        if response.status == 200 and response_data.get('success'):
            print("✅ Login successful!")
            
            # Wait for redirect to admin
            await page.wait_for_load_state('networkidle')
            
            # Step 2: Navigate to staff-test
            print("\n📋 Step 2: Navigate to staff-test page...")
            await page.goto(f"{base_url}/admin/staff-test")
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path="test-staff-test-route.png")
            
            # Step 3: Check page content
            print("\n🔍 Step 3: Analyze staff-test page...")
            
            # Get page title
            title = await page.title()
            print(f"📋 Page Title: {title}")
            
            # Check for 404
            if "404" in title:
                print("❌ Still getting 404 error")
                return False
            else:
                print("✅ No 404 error - page loads successfully!")
                
                # Check for our test content
                test_content = await page.query_selector('h2:has-text("Test Page")')
                if test_content:
                    print("✅ Test page content found!")
                    print("🎉 ROUTE WORKS! The issue was with the 'staff-unified' folder name!")
                    return True
                else:
                    print("⚠️ Page loads but content not found")
                    return False
        else:
            print("❌ Login failed")
            return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        await page.screenshot(path="test-staff-test-error.png")
        return False
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    success = asyncio.run(test_staff_test_route())
    if success:
        print("\n🎉 SUCCESS! The issue was the folder name 'staff-unified'!")
    else:
        print("\n❌ Issue persists even with renamed folder") 