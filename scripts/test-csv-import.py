#!/usr/bin/env python3
"""
CSV Import Browser Automation Test
Tests the complete CSV import workflow that the user is experiencing
"""

import asyncio
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

async def test_csv_import():
    print("🚀 CSV Import Test - Browser Automation")
    print("=" * 50)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
    context = await browser.new_context()
    page = await context.new_page()
    
    # Enable console logging
    page.on("console", lambda msg: print(f"🖥️ Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"🚨 Page Error: {err}"))
    
    try:
        base_url = "https://epg-crm.vercel.app"
        username = "MarkandLouie2025@"
        password = "ySz7JY^4tj@GmUqK"
        
        # Create screenshots directory
        os.makedirs("csv-import-test", exist_ok=True)
        
        print("📍 Step 1: Navigate to admin and login...")
        await page.goto(f"{base_url}/admin")
        await page.wait_for_load_state('networkidle')
        
        # Login
        await page.fill('#username', username)
        await page.fill('#password', password)
        await page.click('button[type="submit"]')
        
        try:
            await page.wait_for_url("**/admin**", timeout=10000)
        except:
            print("⏳ No navigation detected, checking current state...")
        
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path="csv-import-test/01-logged-in.png")
        
        print("📍 Step 2: Navigate to import page...")
        await page.goto(f"{base_url}/admin/import")
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path="csv-import-test/02-import-page.png")
        
        print("📍 Step 3: Upload CSV file...")
        
        # Upload the 10 rows CSV file
        file_input = await page.query_selector('input[type="file"]')
        if file_input:
            await file_input.set_input_files("10 rows.csv")
            print("✅ CSV file uploaded")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="csv-import-test/03-file-uploaded.png")
        else:
            print("❌ File input not found")
            return False
        
        print("📍 Step 4: Set up field mappings...")
        
        # Wait for the mapping interface to appear
        await page.wait_for_timeout(3000)
        
        # Take screenshot of mapping interface
        await page.screenshot(path="csv-import-test/04-mapping-interface.png")
        
        # Set up mappings as user described
        mappings = {
            "firstname": "First Name",
            "surname": "Last Name", 
            "email": "Email",
            "phone": "Phone",
            "suburb": "Suburb",
            "postcode": "Postcode",
            "state": "State"
        }
        
        print("🔄 Setting up field mappings...")
        
        # Get all field mapping dropdowns
        selects = await page.query_selector_all('select')
        print(f"📋 Found {len(selects)} select dropdowns")
        
        # Try a simpler approach - just see what field names are on the page
        page_text = await page.text_content('body')
        print("🔍 Checking what CSV fields are detected...")
        if page_text:
            for csv_field in mappings.keys():
                if csv_field in page_text:
                    print(f"✅ Found CSV field '{csv_field}' on page")
                else:
                    print(f"❌ CSV field '{csv_field}' not found on page")
        else:
            print("⚠️ Could not get page text content")
        
        # Just proceed with import without mapping for now to see what happens
        print("⏩ Proceeding with import to see network traffic...")
        
        await page.wait_for_timeout(2000)
        await page.screenshot(path="csv-import-test/05-mappings-set.png")
        
        print("📍 Step 5: Start import and capture network traffic...")
        
        # Listen for network requests and responses
        import_request = None
        import_response = None
        
        async def handle_request(request):
            if "/import" in request.url:
                nonlocal import_request
                import_request = {
                    "url": request.url,
                    "method": request.method,
                    "headers": dict(request.headers),
                    "post_data": request.post_data
                }
                print(f"📤 Captured import request: {request.method} {request.url}")
        
        async def handle_response(response):
            if "/import" in response.url:
                nonlocal import_response
                try:
                    response_body = await response.text()
                    import_response = {
                        "url": response.url,
                        "status": response.status,
                        "status_text": response.status_text,
                        "body": response_body
                    }
                    print(f"📥 Captured import response: {response.status} {response.status_text}")
                except Exception as e:
                    print(f"⚠️ Could not capture response body: {e}")
        
        page.on("request", handle_request)
        page.on("response", handle_response)
        
        # Look for import button more thoroughly
        print("🔍 Looking for import button...")
        await page.screenshot(path="csv-import-test/05b-before-import-search.png")
        buttons = await page.query_selector_all('button')
        print(f"📋 Found {len(buttons)} buttons on page")
        
        import_button = None
        for i, button in enumerate(buttons):
            try:
                button_text = await button.inner_text()
                print(f"📋 Button {i}: '{button_text}'")
                # Look specifically for "Start Import" button
                if 'start import' in button_text.lower():
                    import_button = button
                    print(f"🎯 Found START IMPORT button: '{button_text}'")
                    break
            except Exception as e:
                print(f"⚠️ Error reading button {i}: {e}")
        
        # If Start Import not found, look for other import-related buttons
        if not import_button:
            print("🔍 Start Import button not found, looking for alternatives...")
            for i, button in enumerate(buttons):
                try:
                    button_text = await button.inner_text()
                    if any(keyword in button_text.lower() for keyword in ['import', 'process', 'upload data']):
                        import_button = button
                        print(f"🎯 Found alternative import button: '{button_text}'")
                        break
                except Exception as e:
                    print(f"⚠️ Error reading button {i}: {e}")
        
        if import_button:
            print("🖱️ Clicking import button...")
            await import_button.click()
            
            # Wait for import to complete
            await page.wait_for_timeout(5000)
            await page.screenshot(path="csv-import-test/06-import-started.png")
            
            # Wait for results
            print("⏳ Waiting for import results...")
            await page.wait_for_timeout(10000)
            await page.screenshot(path="csv-import-test/07-import-results.png")
            
            # Look for results text
            results_text = await page.text_content('body')
            
            print("\n📊 IMPORT RESULTS:")
            print("=" * 30)
            
            # Extract import statistics
            if results_text and "Records Imported:" in results_text:
                lines = results_text.split('\n')
                for line in lines:
                    if "Records Imported:" in line or "Records with Errors:" in line:
                        print(f"📋 {line.strip()}")
            
            # Print captured network data
            print("\n🌐 NETWORK ANALYSIS:")
            print("=" * 30)
            
            if import_request:
                print(f"📤 Request: {import_request['method']} {import_request['url']}")
                if import_request["post_data"]:
                    print(f"📦 Data size: {len(import_request['post_data'])} bytes")
            else:
                print("⚠️ No import request captured")
            
            if import_response:
                print(f"📥 Response: {import_response['status']} {import_response['status_text']}")
                print(f"📋 Response Body:")
                print("-" * 40)
                print(import_response['body'])
                print("-" * 40)
            else:
                print("⚠️ No import response captured")
            
            print("\n🔍 PAGE CONTENT ANALYSIS:")
            print("=" * 30)
            
            # Look for error messages
            error_elements = await page.query_selector_all('.error, .alert-error, [class*="error"], [class*="danger"]')
            for error in error_elements:
                error_text = await error.inner_text()
                if error_text.strip():
                    print(f"🚨 Error found: {error_text}")
            
            # Look for success messages
            success_elements = await page.query_selector_all('.success, .alert-success, [class*="success"]')
            for success in success_elements:
                success_text = await success.inner_text()
                if success_text.strip():
                    print(f"✅ Success message: {success_text}")
            
            await page.screenshot(path="csv-import-test/08-final-state.png")
            
            return True
        else:
            print("❌ Import button not found")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        await page.screenshot(path="csv-import-test/error.png")
        return False
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    success = asyncio.run(test_csv_import())
    if success:
        print("\n🏆 CSV IMPORT TEST COMPLETED")
    else:
        print("\n❌ CSV IMPORT TEST FAILED")
    sys.exit(0 if success else 1) 