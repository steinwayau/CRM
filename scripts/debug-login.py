#!/usr/bin/env python3
"""
Debug Login Script - Investigate login process in detail
"""

import asyncio
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

async def debug_login():
    print("🔍 Debug Login Investigation")
    print("=" * 40)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True, slow_mo=500)
    page = await browser.new_page()
    
    try:
        base_url = "https://epg-crm.vercel.app"
        username = "MarkandLouie2025@"
        password = "ySz7JY^4tj@GmUqK"
        
        # Navigate to admin
        print("📍 Navigating to /admin...")
        await page.goto(f"{base_url}/admin")
        await page.wait_for_load_state('networkidle')
        
        print(f"📋 Current URL: {page.url}")
        print(f"📋 Page title: {await page.title()}")
        
        # Check page content
        content = await page.content()
        print(f"📋 Page contains 'login': {'login' in content.lower()}")
        print(f"📋 Page contains 'username': {'username' in content.lower()}")
        print(f"📋 Page contains 'password': {'password' in content.lower()}")
        
        # Find all input fields
        inputs = await page.query_selector_all('input')
        print(f"📋 Found {len(inputs)} input fields:")
        
        for i, input_elem in enumerate(inputs):
            input_type = await input_elem.get_attribute('type')
            input_name = await input_elem.get_attribute('name')
            input_id = await input_elem.get_attribute('id')
            input_placeholder = await input_elem.get_attribute('placeholder')
            
            print(f"   Input {i+1}: type='{input_type}' name='{input_name}' id='{input_id}' placeholder='{input_placeholder}'")
        
        # Find all buttons
        buttons = await page.query_selector_all('button')
        print(f"📋 Found {len(buttons)} buttons:")
        
        for i, button in enumerate(buttons):
            button_type = await button.get_attribute('type')
            button_text = await button.inner_text()
            print(f"   Button {i+1}: type='{button_type}' text='{button_text}'")
        
        # Try to login with proper field detection
        print("\n🔐 Attempting login...")
        
        # Find email/username field more specifically
        email_field = None
        for input_elem in inputs:
            input_type = await input_elem.get_attribute('type')
            input_name = await input_elem.get_attribute('name')
            input_id = await input_elem.get_attribute('id')
            
            if (input_type == 'email' or 
                (input_name and 'email' in input_name.lower()) or
                (input_id and 'email' in input_id.lower())):
                email_field = input_elem
                print(f"✅ Found email field: type='{input_type}' name='{input_name}' id='{input_id}'")
                break
        
        if email_field:
            await email_field.fill(username)
            print(f"✅ Email filled: {username}")
        else:
            print("❌ Could not find email field")
            return
        
        # Find password field
        password_field = None
        for input_elem in inputs:
            input_type = await input_elem.get_attribute('type')
            if input_type == 'password':
                password_field = input_elem
                print("✅ Found password field")
                break
        
        if password_field:
            await password_field.fill(password)
            print("✅ Password filled")
        else:
            print("❌ Could not find password field")
            return
        
        # Find and click submit button
        submit_button = None
        for button in buttons:
            button_type = await button.get_attribute('type')
            button_text = await button.inner_text()
            
            if (button_type == 'submit' or 
                'login' in button_text.lower() or 
                'sign in' in button_text.lower()):
                submit_button = button
                print(f"✅ Found submit button: '{button_text}'")
                break
        
        if submit_button:
            print("🖱️ Clicking login button...")
            await submit_button.click()
            
            # Wait for response
            try:
                await page.wait_for_load_state('networkidle', timeout=5000)
            except:
                print("⏳ Timeout waiting for navigation, checking current state...")
            
            # Check results
            new_url = page.url
            new_content = await page.content()
            new_title = await page.title()
            
            print(f"\n📊 AFTER LOGIN ATTEMPT:")
            print(f"📋 URL: {new_url}")
            print(f"📋 Title: {new_title}")
            print(f"📋 Contains 'login': {'login' in new_content.lower()}")
            print(f"📋 Contains 'admin': {'admin' in new_content.lower()}")
            print(f"📋 Contains 'dashboard': {'dashboard' in new_content.lower()}")
            
            # Look for error messages
            error_messages = await page.query_selector_all('.error, .alert, [role="alert"], .text-red-500, .text-red-600')
            if error_messages:
                print(f"🚨 Found {len(error_messages)} potential error messages:")
                for i, error in enumerate(error_messages):
                    error_text = await error.inner_text()
                    if error_text.strip():
                        print(f"   Error {i+1}: {error_text}")
            else:
                print("✅ No obvious error messages found")
            
            # Check if we're still on login page
            if '/login' in new_url or 'login' in new_content.lower():
                print("❌ Still on login page - login likely failed")
                
                # Check for validation messages
                validation_msgs = await page.query_selector_all('input:invalid, .invalid, .error')
                if validation_msgs:
                    print("🔍 Checking form validation...")
                    for msg in validation_msgs:
                        validation_text = await msg.inner_text()
                        if validation_text.strip():
                            print(f"   Validation: {validation_text}")
            else:
                print("✅ Login appears successful - redirected away from login")
                
        else:
            print("❌ Could not find submit button")
            
    except Exception as e:
        print(f"❌ Debug failed: {e}")
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    asyncio.run(debug_login()) 