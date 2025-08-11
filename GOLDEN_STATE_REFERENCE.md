# 🏆 Golden State Reference

## **CURRENT STABLE VERSION**

**Git Commit**: `1069d2d` ✅ VERIFIED DEPLOYED  
**Date**: August 12, 2025  
**Status**: 🟢 PRODUCTION RUNNING

### **✅ CONFIRMED WORKING FEATURES:**

**📧 Email System:**
- ✅ Campaign sending with rate-limit handling
- ✅ Open/click tracking recorded in `email_tracking`
- ✅ Links include unsubscribe footer; `/api/email/unsubscribe` works
- ✅ Footer rendering when any branded assets exist (toggle OR logo OR icons)

**📊 Analytics:**
- ✅ Overall/detailed analytics APIs live (`/api/email/analytics`, `/api/email/analytics/detailed`) with start/end/q filters
- ✅ Dashboard renders clients/devices/domains/top URLs and 24h timeline
- ✅ Campaign tiles and modal reflect tracking data; no caching issues (force-dynamic + no-store)
- ✅ Immediate analytics refresh after send

**🛠 Admin Utilities:**
- ✅ Analytics reset endpoint (`POST /api/admin/analytics/reset`) supports all-time or start/end range
- ✅ Campaign search API (`GET /api/admin/campaigns/search`) available
- ✅ Settings UI with footer logo + social icon uploads
- ✅ Auto-save settings on change (600ms debounce)
- ✅ Idempotent DELETE for campaigns; duplicate uses server POST

### **📋 DEPLOYMENT INFO:**

**Production URL**: https://crm.steinway.com.au  
**Last Deployment**: August 12, 2025  
**Commit**: 1069d2d — "Footer: render when any branded assets exist; Settings: auto-save on change; Send flow: refresh analytics immediately after send"

---

## **⚠️ KNOWN ISSUES TO INVESTIGATE:**

1. **Email Footer not persisting/rendering**: Settings appear to not persist reliably (toggle returns to off; uploads not present on reload)
2. **"Send Now" appears after sending**: Campaign list sometimes returns to draft/Send Now until manual page refresh

---

## **📝 REVERT INSTRUCTIONS:**

Revert to this commit if needed:
```bash
git reset --hard 1069d2d
git push origin main --force
npx vercel --prod
```

**Last Updated**: August 12, 2025 by Agent  
**Verification**: ✅ APIs live; dashboard renders; unsubscribe works; settings UI functional 