#!/usr/bin/env python3
"""
Detailed Login Debug - Capture all error messages and network activity
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def debug_login_detailed():
    print("🔍 DETAILED LOGIN DEBUG")
    print("=" * 50)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
    page = await browser.new_page()
    
    # Capture console messages
    console_messages = []
    page.on('console', lambda msg: console_messages.append(f"Console: {msg.text}"))
    
    # Capture network requests
    network_logs = []
    page.on('request', lambda request: network_logs.append(f"Request: {request.method} {request.url}"))
    page.on('response', lambda response: network_logs.append(f"Response: {response.status} {response.url}"))
    
    try:
        base_url = "https://epg-crm.vercel.app"
        username = "MarkandLouie2025@"
        password = "ySz7JY^4tj@GmUqK"
        
        print(f"🌐 Testing credentials: {username}")
        print(f"🔐 Password length: {len(password)}")
        
        # Navigate to login
        print("📍 Step 1: Navigate to login page...")
        await page.goto(f"{base_url}/login")
        await page.wait_for_load_state('networkidle')
        
        # Check initial state
        print(f"📋 URL: {page.url}")
        print(f"📋 Title: {await page.title()}")
        
        # Fill username
        print("📝 Step 2: Fill username field...")
        await page.fill('#username', username)
        username_value = await page.input_value('#username')
        print(f"✅ Username field value: '{username_value}'")
        
        # Fill password
        print("📝 Step 3: Fill password field...")
        await page.fill('#password', password)
        password_value = await page.input_value('#password')
        print(f"✅ Password field filled ({len(password_value)} chars)")
        
        # Clear any previous errors
        await page.wait_for_timeout(1000)
        
        # Submit form
        print("🚀 Step 4: Submit login form...")
        
        # Wait for network activity after clicking submit
        async with page.expect_response(lambda response: '/api/auth/login' in response.url) as response_info:
            await page.click('button[type="submit"]')
            response = await response_info.value
            
        print(f"🌐 Login API response: {response.status}")
        
        # Get response data
        try:
            response_data = await response.json()
            print(f"📊 Response data: {json.dumps(response_data, indent=2)}")
        except:
            response_text = await response.text()
            print(f"📊 Response text: {response_text}")
        
        # Wait for any DOM changes
        await page.wait_for_timeout(2000)
        
        # Check for error messages in the page
        print("🔍 Step 5: Check for error messages...")
        
        # Check for error div
        error_div = await page.query_selector('.bg-red-50')
        if error_div:
            error_text = await error_div.inner_text()
            print(f"🚨 Error message found: {error_text}")
        else:
            print("✅ No error message div found")
        
        # Check current URL after login attempt
        current_url = page.url
        print(f"📍 Current URL after login: {current_url}")
        
        # Check if we're still on login page
        if '/login' in current_url:
            print("❌ Still on login page - login failed")
            
            # Check for any validation errors
            all_errors = await page.query_selector_all('[class*="red"], [class*="error"], .error, .alert')
            if all_errors:
                print("🚨 Found potential error elements:")
                for i, error in enumerate(all_errors):
                    error_text = await error.inner_text()
                    if error_text.strip():
                        print(f"   Error {i+1}: {error_text}")
            else:
                print("🤔 No visible error messages found")
        else:
            print("✅ Redirected away from login page - login may have succeeded")
        
        # Print console messages
        if console_messages:
            print("\n📋 Console messages:")
            for msg in console_messages:
                print(f"   {msg}")
        
        # Print network activity
        if network_logs:
            print("\n🌐 Network activity:")
            for log in network_logs:
                print(f"   {log}")
        
        # Final screenshot
        await page.screenshot(path="debug-login-detailed.png")
        print("📸 Screenshot saved: debug-login-detailed.png")
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        await page.screenshot(path="debug-login-error.png")
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    asyncio.run(debug_login_detailed()) 