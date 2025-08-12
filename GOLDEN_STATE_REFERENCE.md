# 🏆 Golden State Reference

## CURRENT STABLE VERSION

- Commit: `94bbe2b` (main)
- Deployment: https://crm.steinway.com.au
- Status: ✅ Production live and verified
- Date: Updated automatically after deployment

### What’s confirmed working in this Golden State

- Email footer
  - Branded footer toggle persists across sessions
  - Logo and social icon URLs persist and render in emails
  - Phone line displayed in bold as requested
- Email sending
  - Footer builder reads icon URLs via Prisma from system settings
- Admin Settings
  - Reliable saves (Prisma transaction), dynamic route (no stale cache)
  - Debounced, functional state saves to prevent stale writes after uploads
- Campaign management
  - Delete actions refresh both current and previous lists and close the modal

### Rollback

If needed, revert to this exact state:

```bash
# From repo root
git checkout 94bbe2b
npx vercel --prod
```

Keep this as the baseline for future work. 