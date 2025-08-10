# 🚀 COMPREHENSIVE DEPLOYMENT PROTOCOL FOR FUTURE AGENTS

## **🚨 CRITICAL: READ EVERY SECTION BEFORE ANY DEPLOYMENT 🚨**

This document outlines the COMPLETE deployment process to avoid the catastrophic deployment disasters that have plagued previous agents, including wrong accounts, authentication failures, git sync issues, and unauthorized deployments.

---

## **⚠️ ABSOLUTE RULES - NO EXCEPTIONS**

### **🛑 PERMISSION PROTOCOL**
- **NEVER DEPLOY WITHOUT EXPLICIT PERMISSION** - Implementation ≠ Deployment Permission
- **ASK SEPARATELY**: "May I implement this?" vs "May I deploy this to production?"
- **INVESTIGATION ONLY** means NO deployments, NO changes, NO commits
- **UNAUTHORIZED DEPLOYMENT = INSTANT TERMINATION**

### **🛑 GITHUB AUTHENTICATION REQUIREMENTS**
- **ALWAYS VERIFY** git authentication before attempting to push
- **CHECK TOKEN STATUS** if push fails with authentication errors
- **NEVER SKIP** git push to GitHub - Vercel needs GitHub sync
- **VERIFY PUSH SUCCESS** before claiming deployment success

---

## **📋 COMPLETE DEPLOYMENT WORKFLOW**

### **🎯 Phase 1: Pre-Deployment Verification**

#### **1.1 Directory Verification**
```bash
# MANDATORY: Verify working directory
pwd
# MUST show: /Volumes/STEINWAY/CRM REBUILD/epg-crm
```

#### **1.2 Git Status Check**
```bash
# Check what needs to be committed
git status

# Verify remote configuration
git remote -v
# MUST show: https://github.com/steinwayau/CRM.git

# Check commit history
git log --oneline -5
```

#### **1.3 Authentication Verification**
```bash
# Test GitHub connectivity
git ls-remote origin main
# If this fails → GitHub authentication issue → STOP
```

### **🎯 Phase 2: Git Synchronization (MANDATORY)**

#### **2.1 Commit Changes**
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "CLEAR_DESCRIPTION: What was fixed and why

- Specific change 1
- Specific change 2
- Resolves: Specific issue description"
```

#### **2.2 Push to GitHub (CRITICAL)**
```bash
# Push to GitHub (REQUIRED for Vercel sync)
git push origin main

# VERIFY SUCCESS: Check for "fast-forward" or similar success message
# If authentication fails → Follow GitHub Token Recovery Protocol
```

### **🎯 Phase 3: Production Deployment**

#### **3.1 Deploy to Production**

Primary path (default): Git auto-deploy via Vercel
- Push to `main` and Vercel will build and promote to Production automatically.
- Do not run the CLI if Git auto-deploy is enabled, to avoid duplicate deployments.

Verification steps:
1) Push succeeds (see GitHub repo updated)
2) Open Vercel → Project → Deployments → latest Production build is in progress/completed
3) Production URL shows the new build when finished

Optional path (only if Git auto-deploy is disabled/approved):
```bash
npx vercel --prod
# Use this ONLY when Git auto-deploy is off to avoid duplicates
```

#### **3.2 Verify Deployment Success**
**REQUIRED SUCCESS INDICATORS:**
- ✅ Output shows: "Production: https://crm.steinway.com.au"
- ✅ Changes visible on https://crm.steinway.com.au
- ✅ No authentication errors
- ✅ No preview URLs mentioned

**❌ FAILURE INDICATORS:**
- Preview URLs only
- Different domains (epg-*.vercel.app)
- Authentication required errors
- 404 or deployment not found errors

---

## **🚨 GITHUB TOKEN RECOVERY PROTOCOL**

### **When Git Push Fails (Authentication Error)**

#### **Step 1: Identify the Problem**
```bash
# Test GitHub connectivity
git push origin main
# If fails with "Authentication failed" → Token expired
```

#### **Step 2: Guide User to Fix Token**
**Direct user to:**
1. **GitHub Settings**: https://github.com/settings/tokens
2. **Personal Access Tokens** → **Tokens (classic)**
3. **Delete expired token** if exists
4. **Generate new token (classic)** with:
   - **Note**: "CRM Development Token - No Expiration"
   - **Expiration**: No expiration
   - **Scopes**: `repo`, `workflow`, `user`

#### **Step 3: Update Git Remote (After User Provides New Token)**
```bash
# Update remote URL with new token
git remote set-url origin https://NEW_TOKEN@github.com/steinwayau/CRM.git

# Test the fix
git push origin main
```

---

## **🚨 COMMON DEPLOYMENT DISASTERS & SOLUTIONS**

### **❌ Disaster #1: Wrong Vercel Account**
**Problem**: Deploying to agent's personal account instead of client's
**Solution**: 
- Use `npx vercel --prod` (uses existing project config)
- NEVER run `vercel login` or link new projects
- Verify output shows `crm.steinway.com.au`

### **❌ Disaster #2: Preview-Only Deployments**
**Problem**: Using `npx vercel` without `--prod`
**Solution**: ALWAYS include `--prod` flag
**Verification**: Output MUST show "Production:" not "Preview:"

### **❌ Disaster #3: GitHub Sync Failure**
**Problem**: Deploying without pushing to GitHub first
**Consequence**: Changes lost, deployment inconsistent
**Solution**: ALWAYS git push BEFORE deployment

### **❌ Disaster #4: Authentication Token Expiry**
**Problem**: Git push fails, agent gives up
**Solution**: Follow GitHub Token Recovery Protocol above

### **❌ Disaster #5: Multiple Conflicting Deployments**
**Problem**: Duplicate Production builds (Git + CLI)
**Solution**:
- Prefer Git auto-deploy (push to `main`) and do NOT run `npx vercel --prod`.
- Or, if CLI is required, disable Git auto-deploy in Vercel first.

### **❌ Disaster #6: Unauthorized Deployment**
**Problem**: Deploying without explicit permission
**Solution**: ASK FOR DEPLOYMENT PERMISSION SEPARATELY from implementation

---

## **✅ SUCCESS VERIFICATION CHECKLIST**

### **Before Starting Deployment:**
- [ ] **Permission Granted**: User explicitly approved deployment
- [ ] **Directory Correct**: In `/Volumes/STEINWAY/CRM REBUILD/epg-crm`
- [ ] **Changes Ready**: All code changes implemented and tested locally
- [ ] **Git Clean**: All changes committed with descriptive messages

### **During Git Push:**
- [ ] **Authentication Works**: `git push origin main` succeeds
- [ ] **Fast-Forward**: No merge conflicts or force-push needed
- [ ] **GitHub Updated**: Changes visible on GitHub repo

### **During Vercel Deployment:**
- [ ] **Command Used**: `npx vercel --prod` (exact command)
- [ ] **Production URL**: Output shows "Production: https://crm.steinway.com.au"
- [ ] **No Errors**: No authentication or deployment errors
- [ ] **No Preview URLs**: Only production URL mentioned

### **After Deployment:**
- [ ] **Site Accessible**: https://crm.steinway.com.au loads without errors
- [ ] **Changes Live**: Specific fixes are visible and functional
- [ ] **No Authentication Barriers**: Site works for end users
- [ ] **User Notification**: User informed of successful deployment with URL

---

## **🔄 ROLLBACK PROTOCOL (If Deployment Fails)**

### **Immediate Actions:**
1. **Stop deployment process** if errors occur
2. **Document exact error messages**
3. **Do NOT attempt multiple deployment commands**
4. **Inform user of issue immediately**

### **Recovery Steps:**
```bash
# Check current deployment status
git log --oneline -3

# If needed, revert to last working commit
git reset --hard HEAD~1

# Push revert
git push origin main --force-with-lease

# Deploy previous working version
npx vercel --prod
```

---

## **📞 EMERGENCY CONTACTS & RESOURCES**

### **When Everything Goes Wrong:**
1. **STOP ALL DEPLOYMENT ATTEMPTS**
2. **Document exact error messages and commands used**
3. **Inform user immediately with:**
   - What went wrong
   - What you tried
   - What you need to fix it
4. **Wait for user guidance before proceeding**

### **Key Resources:**
- **GitHub Token Settings**: https://github.com/settings/tokens
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Production URL**: https://crm.steinway.com.au

---

## **🎯 THE GOLDEN RULES - MEMORIZE THESE**

### **Rule #1: Permission First**
**NEVER deploy without explicit permission**

### **Rule #2: Git Push Always**
**NEVER deploy without pushing to GitHub first**

### **Rule #3: One Deployment Path Only**
**EITHER** push to `main` (Git auto-deploy) **OR** run `npx vercel --prod` (if Git auto-deploy is disabled) — not both.

### **Rule #4: Verify Everything**
**NEVER claim success without verification**

### **Rule #5: When In Doubt, Stop**
**ASK USER rather than guess**

---

## **⚡ QUICK REFERENCE - COPY/PASTE COMMANDS**

```bash
# COMPLETE DEPLOYMENT SEQUENCE:
cd "/Volumes/STEINWAY/CRM REBUILD/epg-crm"
pwd  # Verify directory
git status  # Check changes
git add .  # Stage changes
git commit -m "FIX_DESCRIPTION: Specific changes made"  # Commit
git push origin main  # Push to GitHub (CRITICAL)
npx vercel --prod  # Deploy to production
```

**SUCCESS INDICATOR:**
```
✅  Production: https://crm.steinway.com.au [X]s
```

**FAILURE INDICATORS TO WATCH FOR:**
- Authentication failed
- Preview: [URL] (missing --prod)
- Different domain than crm.steinway.com.au
- Command not found errors

---

**🚨 REMEMBER: This protocol exists because 55+ agents have failed with deployment issues. Following it exactly is not optional - it's mandatory for success. 🚨** 

---

## 🔒 Single Source of Truth (SST) Deployment Flow

Follow this exact order. Do not mix paths.

1) Commit and push to GitHub main
```
git add -A
git commit -m "DEPLOY: <short description>"
git push origin main
```
2) Watch Vercel Deployments page until the new Production build is Ready
- Project: `epg-crm`
- Branch: `main`
- Status: Ready

3) Verify alias points to the new deployment (must be the custom domain)
```
npx vercel inspect crm.steinway.com.au | cat
# Expect: Aliases section includes https://crm.steinway.com.au on the NEW deployment URL
```
If alias is NOT on the new deployment (or UI looks stale), do ONE of the following, not both:
- A) Promote the new deployment to the alias
```
npx vercel alias set <new-deployment>.vercel.app crm.steinway.com.au | cat
```
- B) Force a cache-bypassed rebuild, then re-alias
```
npx vercel --prod --force | cat
npx vercel alias set <forced-deployment>.vercel.app crm.steinway.com.au | cat
```

4) Validate on production without forcing user cache clears
- Add a tiny version chip change (e.g., "Editor v <shortSHA> · EG vX.Y") so the new UI is visually obvious
- Open `https://crm.steinway.com.au/?v=<shortSHA>` to bypass intermediate caching safely

5) Record the deployment
- Paste deployment URL and time into the task comment or doc
- Example: `Deployed epg-ot4595o12… → crm.steinway.com.au (13:14 AEST)`

---

## ✅ Operator Checklist (must tick each)
- [ ] Pushed to GitHub `main` and saw commit on GitHub
- [ ] Vercel Deployment for `main` shows Ready
- [ ] `vercel inspect crm.steinway.com.au` shows the new deployment URL under Aliases
- [ ] If not, ran `vercel alias set … crm.steinway.com.au` against the intended deployment
- [ ] Verified visually on the main domain (version chip updated)
- [ ] Posted deployment ID + timestamp in the task

---

## 🧯 Troubleshooting playbook (fast)
- Seeing old UI but deployment says Ready:
  - Confirm alias via: `vercel inspect crm.steinway.com.au`
  - If alias is old, run: `vercel alias set <new>.vercel.app crm.steinway.com.au`
  - If still stale, run: `vercel --prod --force` then alias set again
- Never tell the user “deployed” until alias inspect confirms the mapping. 