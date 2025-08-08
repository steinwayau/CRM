# 🏆 Golden State Reference

## **CURRENT STABLE VERSION**

**Git Commit**: `6f6cef3` ✅ VERIFIED DEPLOYED  
**Date**: August 9, 2025  
**Status**: 🟢 PRODUCTION RUNNING

### **✅ CONFIRMED WORKING FEATURES:**

**📧 Email System:**
- ✅ Campaign sending with rate-limit handling
- ✅ Open/click tracking recorded in `email_tracking`
- ✅ Links include unsubscribe footer; `/api/email/unsubscribe` works

**📊 Analytics:**
- ✅ Overall/detailed analytics APIs live (`/api/email/analytics`, `/api/email/analytics/detailed`) with start/end/q filters
- ✅ Dashboard renders clients/devices/domains/top URLs and 24h timeline

**🛠 Admin Utilities:**
- ✅ Analytics reset endpoint (`POST /api/admin/analytics/reset`) supports all-time or start/end range
- ✅ Campaign search API (`GET /api/admin/campaigns/search`) available

### **📋 DEPLOYMENT INFO:**

**Production URL**: https://crm.steinway.com.au  
**Last Deployment**: August 9, 2025  
**Commit**: 6f6cef3 — "Analytics UI: add Reset analytics dialog (current/all/custom range) with confirmation; endpoint supports start/end; list refresh after reset"

---

## **⚠️ KNOWN ISSUES TO INVESTIGATE:**

1. Reset button in Analytics UI opens dialog but action may not execute (no visible effect) — verify POST and UI wiring.  
2. Previous campaigns list added under Analytics; search UX should mirror analytics filters and load automatically.  
3. Date preset behavior: ranges can look identical when data is only in recent window; consider showing “N events in range” chip.

---

## **📝 REVERT INSTRUCTIONS:**

Revert to this commit if needed:
```bash
git reset --hard 6f6cef3
git push origin main --force
npx vercel --prod
```

**Last Updated**: August 9, 2025 by Agent  
**Verification**: ✅ APIs live; dashboard renders; unsubscribe works 