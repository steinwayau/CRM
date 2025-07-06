#!/usr/bin/env python3
"""
Browser Automation Test Script
Tests CRM system URLs and authentication flows
"""

import urllib.request
import urllib.error
import urllib.parse
import json
import time
import sys
from datetime import datetime

class CRMTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_cookies = {}
        self.results = []
        
    def test_url(self, path, expected_status=200, description=""):
        """Test a URL and return detailed results"""
        full_url = f"{self.base_url}{path}"
        
        try:
            print(f"🔍 Testing: {full_url}")
            
            # Create request with any existing cookies
            request = urllib.request.Request(full_url)
            
            # Add cookies if we have them
            if self.session_cookies:
                cookie_header = "; ".join([f"{k}={v}" for k, v in self.session_cookies.items()])
                request.add_header('Cookie', cookie_header)
            
            # Make request
            response = urllib.request.urlopen(request)
            
            # Get response details
            status = response.status
            headers = dict(response.headers)
            content_type = headers.get('content-type', 'unknown')
            
            # Read some content to check for 404 pages
            content = response.read(1000).decode('utf-8', errors='ignore')
            
            # Check for 404 indicators in content
            is_404_page = any(indicator in content.lower() for indicator in [
                'not found', '404', 'page not found', 'does not exist'
            ])
            
            result = {
                'url': full_url,
                'status': status,
                'content_type': content_type,
                'is_404_page': is_404_page,
                'content_preview': content[:200] + "..." if len(content) > 200 else content,
                'success': status == expected_status and not is_404_page,
                'description': description
            }
            
            if result['success']:
                print(f"✅ {path} - OK ({status}) - {content_type}")
            else:
                print(f"❌ {path} - ISSUE ({status}) - {content_type}")
                if is_404_page:
                    print(f"   📄 Contains 404 content")
                    
        except urllib.error.HTTPError as e:
            result = {
                'url': full_url,
                'status': e.code,
                'content_type': 'error',
                'is_404_page': e.code == 404,
                'content_preview': str(e),
                'success': False,
                'description': description
            }
            print(f"❌ {path} - HTTP ERROR ({e.code}) - {e.reason}")
            
        except Exception as e:
            result = {
                'url': full_url,
                'status': 'ERROR',
                'content_type': 'error',
                'is_404_page': False,
                'content_preview': str(e),
                'success': False,
                'description': description
            }
            print(f"❌ {path} - ERROR - {str(e)}")
            
        self.results.append(result)
        time.sleep(0.5)  # Small delay between requests
        return result
    
    def test_admin_redirect(self, path):
        """Test admin pages that should redirect to login"""
        full_url = f"{self.base_url}{path}"
        
        try:
            print(f"🔍 Testing Admin Redirect: {full_url}")
            
            # Create request that doesn't follow redirects
            request = urllib.request.Request(full_url)
            
            # Try to open - this will raise exception for redirects
            response = urllib.request.urlopen(request)
            
            # If we get here, no redirect happened
            status = response.status
            content = response.read(1000).decode('utf-8', errors='ignore')
            
            result = {
                'url': full_url,
                'status': status,
                'redirect': False,
                'content_preview': content[:200] + "..." if len(content) > 200 else content,
                'success': status == 200,  # Either accessible or should redirect
                'description': f"Admin page - no redirect (status: {status})"
            }
            
            print(f"✅ {path} - ACCESSIBLE ({status}) - No authentication required")
            
        except urllib.error.HTTPError as e:
            if e.code in [301, 302, 307, 308]:
                # This is expected for protected admin pages
                result = {
                    'url': full_url,
                    'status': e.code,
                    'redirect': True,
                    'redirect_location': e.headers.get('Location', 'unknown'),
                    'content_preview': f"Redirect to: {e.headers.get('Location', 'unknown')}",
                    'success': True,  # Redirect is expected
                    'description': f"Admin page - redirects to login (status: {e.code})"
                }
                print(f"✅ {path} - PROTECTED ({e.code}) - Redirects to login")
            else:
                result = {
                    'url': full_url,
                    'status': e.code,
                    'redirect': False,
                    'content_preview': str(e),
                    'success': False,
                    'description': f"Admin page - error (status: {e.code})"
                }
                print(f"❌ {path} - ERROR ({e.code}) - {e.reason}")
                
        except Exception as e:
            result = {
                'url': full_url,
                'status': 'ERROR',
                'redirect': False,
                'content_preview': str(e),
                'success': False,
                'description': f"Admin page - error: {str(e)}"
            }
            print(f"❌ {path} - ERROR - {str(e)}")
            
        self.results.append(result)
        time.sleep(0.5)
        return result
    
    def run_comprehensive_test(self):
        """Run comprehensive CRM system test"""
        print("🚀 Starting Comprehensive CRM System Test")
        print("=" * 50)
        
        # Test public pages
        print("\n📋 Testing Public Pages:")
        self.test_url("/", 200, "Home page")
        self.test_url("/login", 200, "Login page")
        
        # Test API endpoints
        print("\n📋 Testing API Endpoints:")
        self.test_url("/api/admin/staff", 200, "Staff API endpoint")
        
        # Test protected admin pages (should redirect)
        print("\n📋 Testing Protected Admin Pages:")
        self.test_admin_redirect("/admin")
        self.test_admin_redirect("/admin/staff-management")
        
        # Test the problematic staff-unified page
        print("\n📋 Testing Problematic Pages:")
        self.test_admin_redirect("/admin/staff-unified")
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📝 Total: {total_tests}")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"   {result['url']} - {result['status']} - {result['description']}")
                    if result.get('is_404_page'):
                        print(f"      📄 Contains 404 content")
        
        print(f"\n📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'results': self.results
        }

def main():
    """Main test execution"""
    base_url = "https://epg-crm.vercel.app"
    
    print("🔧 CRM Browser Automation Test")
    print(f"🌐 Testing: {base_url}")
    print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = CRMTester(base_url)
    summary = tester.run_comprehensive_test()
    
    # Return results for analysis
    return summary

if __name__ == "__main__":
    try:
        results = main()
        sys.exit(0 if results['failed'] == 0 else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1) 