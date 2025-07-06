const { chromium } = require('playwright');

async function testDeployment() {
  console.log('🚀 Starting automated deployment test...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const baseUrl = 'https://epg-crm.vercel.app';
  const testUrls = [
    '/',
    '/admin',
    '/admin/staff-unified',
    '/admin/staff-management',
    '/api/admin/staff'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${baseUrl}${url}`);
      const response = await page.goto(`${baseUrl}${url}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const status = response.status();
      const title = await page.title();
      
      if (status === 200) {
        console.log(`✅ ${url} - OK (${status}) - ${title}`);
        results.push({ url, status, title, success: true });
      } else {
        console.log(`❌ ${url} - ERROR (${status}) - ${title}`);
        results.push({ url, status, title, success: false });
      }
      
      // Wait a moment between requests
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log(`❌ ${url} - FAILED: ${error.message}`);
      results.push({ url, status: 'ERROR', title: error.message, success: false });
    }
  }
  
  await browser.close();
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n🔍 FAILED TESTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.url} - ${r.status} - ${r.title}`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  testDeployment().catch(console.error);
}

module.exports = testDeployment; 