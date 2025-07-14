#!/usr/bin/env python3
"""
Admin Panel Data Exploration Script
Explores the admin panel to find where imported customer data is stored
"""

import asyncio
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

async def explore_admin_data():
    print("🔍 Admin Panel Data Exploration")
    print("=" * 50)
    
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
    context = await browser.new_context()
    page = await context.new_page()
    
    # Enable console logging
    page.on("console", lambda msg: print(f"🖥️ Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"🚨 Page Error: {err}"))
    
    try:
        print("📍 Step 1: Login to admin panel...")
        await page.goto("https://epg-crm.vercel.app/login")
        await page.screenshot(path="admin-exploration/01-login-page.png")
        
        # Login with credentials
        try:
            # Fill username field
            username_input = await page.query_selector('input[id="username"]')
            if not username_input:
                username_input = await page.query_selector('input[name="username"]')
            if not username_input:
                username_input = await page.query_selector('input[type="text"]')
            
            if username_input:
                await username_input.fill('MarkandLouie2025@')
                print("✅ Username filled successfully")
            else:
                print("❌ Could not find username input")
                
            # Fill password field
            password_input = await page.query_selector('input[id="password"]')
            if not password_input:
                password_input = await page.query_selector('input[type="password"]')
                
            if password_input:
                await password_input.fill('ySz7JY^4tj@GmUqK')
                print("✅ Password filled successfully")
            else:
                print("❌ Could not find password input")
                
            # Click submit button
            submit_button = await page.query_selector('button[type="submit"]')
            if not submit_button:
                submit_button = await page.query_selector('button:has-text("Sign In")')
                
            if submit_button:
                await submit_button.click()
                print("✅ Login button clicked")
            else:
                print("❌ Could not find login button")
                
        except Exception as e:
            print(f"❌ Login error: {e}")
        
        try:
            await page.wait_for_url("**/admin**", timeout=10000)
            print("✅ Successfully logged in to admin panel")
        except:
            print("⏳ Checking current state after login...")
        
        await page.screenshot(path="admin-exploration/02-admin-dashboard.png")
        
        print("📍 Step 2: Exploring admin dashboard...")
        current_url = page.url
        print(f"🌐 Current URL: {current_url}")
        
        # Get all navigation links
        nav_links = await page.query_selector_all('a[href*="/admin"]')
        print(f"📋 Found {len(nav_links)} admin navigation links:")
        
        admin_sections = []
        for i, link in enumerate(nav_links):
            try:
                href = await link.get_attribute('href')
                text = await link.inner_text()
                if href and text:
                    admin_sections.append({'text': text.strip(), 'href': href})
                    print(f"  {i+1}. {text.strip()} → {href}")
            except:
                pass
        
        print("📍 Step 3: Checking Database Management...")
        database_link = None
        for section in admin_sections:
            if 'database' in section['text'].lower() or 'data' in section['text'].lower():
                database_link = section['href']
                break
        
        if database_link:
            print(f"🎯 Found Database Management: {database_link}")
            await page.goto(f"https://epg-crm.vercel.app{database_link}")
            await page.screenshot(path="admin-exploration/03-database-management.png")
            
            # Check what's available in database management
            page_text = await page.text_content('body')
            print("📋 Database Management Content:")
            if page_text:
                lines = page_text.split('\n')
                for line in lines[:20]:  # First 20 lines
                    if line.strip():
                        print(f"  {line.strip()}")
        
        print("📍 Step 4: Looking for Customer/Enquiry data sections...")
        
        # Check for customer/enquiry related sections
        customer_sections = []
        for section in admin_sections:
            text_lower = section['text'].lower()
            if any(keyword in text_lower for keyword in ['customer', 'enquiry', 'enquiries', 'user', 'contact', 'data']):
                customer_sections.append(section)
        
        print(f"📋 Found {len(customer_sections)} potential customer data sections:")
        for section in customer_sections:
            print(f"  • {section['text']} → {section['href']}")
        
        # Explore each customer-related section
        for i, section in enumerate(customer_sections):
            print(f"\n📍 Step 5.{i+1}: Exploring '{section['text']}'...")
            try:
                await page.goto(f"https://epg-crm.vercel.app{section['href']}")
                await page.screenshot(path=f"admin-exploration/04-{i+1}-{section['text'].lower().replace(' ', '-')}.png")
                
                # Check for data tables or lists
                tables = await page.query_selector_all('table')
                if tables:
                    print(f"  📊 Found {len(tables)} table(s)")
                    
                    # Get table headers and row count
                    for j, table in enumerate(tables):
                        try:
                            headers = await table.query_selector_all('th')
                            rows = await table.query_selector_all('tr')
                            
                            if headers:
                                header_texts = []
                                for header in headers:
                                    header_text = await header.inner_text()
                                    header_texts.append(header_text.strip())
                                print(f"    Table {j+1} Headers: {', '.join(header_texts)}")
                            
                            print(f"    Table {j+1} Rows: {len(rows)} total")
                            
                            # Check if this looks like customer data
                            table_text = await table.inner_text()
                            if any(keyword in table_text.lower() for keyword in ['email', 'phone', 'name', 'firstname', 'lastname']):
                                print(f"    🎯 This table appears to contain customer data!")
                                
                                # Get first few rows of data
                                data_rows = await table.query_selector_all('tbody tr')
                                if data_rows:
                                    print(f"    📋 Sample data (first 3 rows):")
                                    for k, row in enumerate(data_rows[:3]):
                                        row_text = await row.inner_text()
                                        cells = row_text.split('\t')
                                        print(f"      Row {k+1}: {' | '.join(cells[:5])}...")  # First 5 cells
                        except Exception as e:
                            print(f"    ⚠️ Error reading table {j+1}: {e}")
                
                # Check for cards or other data displays
                cards = await page.query_selector_all('[class*="card"], [class*="item"], [class*="record"]')
                if cards:
                    print(f"  📋 Found {len(cards)} card/item elements")
                
                # Look for pagination or record counts
                page_text = await page.text_content('body')
                if page_text:
                    if 'records' in page_text.lower() or 'total' in page_text.lower():
                        lines = page_text.split('\n')
                        for line in lines:
                            if any(keyword in line.lower() for keyword in ['records', 'total', 'count', 'imported']):
                                print(f"  📊 Found count info: {line.strip()}")
                
            except Exception as e:
                print(f"  ❌ Error exploring '{section['text']}': {e}")
        
        print("\n📍 Step 6: Checking for submitted forms or enquiry data...")
        
        # Check if there's a specific enquiry data section
        try:
            await page.goto("https://epg-crm.vercel.app/submitted-forms/enquiry-data")
            await page.screenshot(path="admin-exploration/05-enquiry-data.png")
            
            print("🎯 Found enquiry data section!")
            
            # Check for data in this section
            tables = await page.query_selector_all('table')
            if tables:
                print(f"📊 Found {len(tables)} table(s) in enquiry data section")
                
                for j, table in enumerate(tables):
                    try:
                        rows = await table.query_selector_all('tr')
                        print(f"  Table {j+1}: {len(rows)} rows")
                        
                        # Get headers
                        headers = await table.query_selector_all('th')
                        if headers:
                            header_texts = []
                            for header in headers:
                                header_text = await header.inner_text()
                                header_texts.append(header_text.strip())
                            print(f"  Headers: {', '.join(header_texts)}")
                        
                        # Get sample data
                        data_rows = await table.query_selector_all('tbody tr')
                        if data_rows:
                            print(f"  📋 Data rows: {len(data_rows)}")
                            
                            # Show first few rows
                            for k, row in enumerate(data_rows[:5]):
                                row_text = await row.inner_text()
                                cells = row_text.split('\t')
                                print(f"    Row {k+1}: {' | '.join(cells[:4])}...")
                    except Exception as e:
                        print(f"  ⚠️ Error reading table {j+1}: {e}")
            
            # Check for any import-related information
            page_text = await page.text_content('body')
            if page_text and 'import' in page_text.lower():
                print("📋 Found import-related content in enquiry data section")
                
        except Exception as e:
            print(f"⚠️ Could not access enquiry data section: {e}")
        
        print("\n📍 Step 7: Summary of findings...")
        print("🎯 Data Location Summary:")
        print("=" * 30)
        
        # Final summary screenshot
        await page.screenshot(path="admin-exploration/06-final-summary.png")
        
    except Exception as e:
        print(f"❌ Error during exploration: {e}")
        await page.screenshot(path="admin-exploration/error-screenshot.png")
    
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    # Create screenshots directory
    os.makedirs("admin-exploration", exist_ok=True)
    
    # Run the exploration
    asyncio.run(explore_admin_data()) 