# CURRENT ISSUES (Updated by Agent)

Date: 2025-08-12
Environment: Production (crm.steinway.com.au)

## 1) Template editor — Paste formatting and auto‑expand (UNRESOLVED)
- Symptom:
  - Pasting from Google Docs/Word does not retain basic formatting when using Cmd/Ctrl+V; user must right‑click → Paste.
  - Text boxes do not auto‑expand to fit longer pasted text; content gets clipped.
- What I tried (did not meet requirements):
  - Added a sanitized HTML paste handler to the canvas editor and properties panel.
  - Introduced optional `contentHtml` and attempted auto‑height measurement and resize on paste/save.
  - Updated email generation to prefer formatted content for text/heading.
- Why this failed for the user:
  - Keyboard paste (Cmd/Ctrl+V) still not consistently captured in both editors in production.
  - Auto‑expand sizing was not reliable across both edit paths (canvas textarea vs properties panel), so boxes still clipped.
- Do not repeat:
  - Do not modify `updateElement()` image/resize logic.
  - Do not change existing drag/resize or selection behavior while attempting paste fixes.
- Suggested next steps (handover):
  1) Handle keyboard paste at both inputs with a single shared handler; verify on macOS Chrome/Safari.
  2) Use a hidden measurement element to compute height and update only `style.height` on change; no other style merges.
  3) Persist both plain text and minimal safe HTML; render plain text in canvas with line breaks, use HTML only in email output.
  4) Add a small telemetry log during paste to confirm the path used (canvas vs properties) in production.

---

Last updated by: Current agent on Aug 12, 2025
