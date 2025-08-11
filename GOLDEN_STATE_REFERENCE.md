# 🏆 Golden State Reference

## **CURRENT STABLE VERSION**

**Git Commit**: `6d84199` ✅ VERIFIED DEPLOYED  
**Date**: August 11, 2025  
**Status**: 🟢 PRODUCTION RUNNING

### **✅ CONFIRMED WORKING FEATURES:**

**📧 Email System:**
- ✅ Campaign sending with rate-limit handling
- ✅ Open/click tracking recorded in `email_tracking`
- ✅ Links include unsubscribe footer; `/api/email/unsubscribe` works

**📊 Analytics:**
- ✅ Overall/detailed analytics APIs live (`/api/email/analytics`, `/api/email/analytics/detailed`) with start/end/q filters
- ✅ Dashboard renders clients/devices/domains/top URLs and 24h timeline
- ✅ Campaign tiles and modal reflect tracking data; no caching issues (force-dynamic + no-store)

**🛠 Admin Utilities:**
- ✅ Analytics reset endpoint (`POST /api/admin/analytics/reset`) supports all-time or start/end range
- ✅ Campaign search API (`GET /api/admin/campaigns/search`) available

### **📋 DEPLOYMENT INFO:**

**Production URL**: https://crm.steinway.com.au  
**Last Deployment**: August 11, 2025  
**Commit**: 6d84199 — "Analytics API: force-dynamic + no-store headers to avoid caching; tiles still read latest data"

---

## **⚠️ KNOWN ISSUES TO INVESTIGATE:**

1. Reset button analytics refresh UX: ensure tiles and modal always reflect resets instantly.  
2. Previous campaigns list search UX: mirror analytics filters and auto-load.

---

## **📝 REVERT INSTRUCTIONS:**

Revert to this commit if needed:
```bash
git reset --hard 6d84199
git push origin main --force
npx vercel --prod
```

**Last Updated**: August 11, 2025 by Agent  
**Verification**: ✅ APIs live; dashboard renders; unsubscribe works 