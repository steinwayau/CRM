# CURRENT ISSUES (Updated by Agent)

Date: 2025-08-13
Environment: Production (crm.steinway.com.au)
Golden State: `8cd5197`

## ✅ Resolved since last update
- Gmail text blocks now preserve paragraphs/line breaks (uses contentHtml or newline→paragraph fallback).
- Editor context‑menu closes on click‑away/Escape/scroll.

## 🔧 Remaining / New items
1) Undo/Redo support (robust history, keyboard shortcuts)
2) Stay on editor after saving/updating a template (do not navigate away)
3) Canvas height dropdown: add Custom option for arbitrary heights (emails may exceed 2000px)
4) Duplicate campaign flow in View Campaign popup is buggy: duplicates campaign but sending reports success without actual sends; duplicate recipients shown — needs fix
5) Footer social icons clicks not appearing in analytics; all clickable items (including hardcoded icons) must be tracked
6) Inline text editor UX: placing cursor to create paragraphs is stubborn; Enter often fails to insert a new line; improve typing/paragraph behavior
7) Analytics require manual browser refresh to update “Sent” status and metrics after sending; needs real-time or reliable refresh

---

Last updated by: Current agent on Aug 13, 2025
