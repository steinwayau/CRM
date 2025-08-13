# 🏆 Golden State Reference

## CURRENT STABLE VERSION

- Commit: `16fbcc0` (main)
- Deployment: https://crm.steinway.com.au
- Status: ✅ Production live and verified
- Date: Updated after deployment

### What’s confirmed working in this Golden State

- Gmail text rendering
  - Paragraphs/line breaks preserved for text blocks (uses contentHtml or newline→paragraph fallback)
- Context menu
  - Right‑click Copy/Duplicate/Paste/Delete closes on click‑away/Escape/scroll
- Template editor essentials
  - Corner-resize snapping improved and stable
  - Cmd/Ctrl+V paste works in properties and inline editors
- Email sending
  - Gmail client uses Gmail‑specific generator; others use standard generator

### Rollback

If needed, revert to this exact state:

```bash
# From repo root
git checkout 8cd5197
npx vercel --prod
```

Keep this as the baseline for future work. 