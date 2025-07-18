🚨 MANDATORY AGENT PROTOCOL - COPY THIS TO EVERY NEW AGENT 🚨

🛑 MANDATORY PERMISSION GATE - READ THIS FIRST 🛑 

STOP IMMEDIATELY - You are NOT allowed to use ANY tools or take ANY actions until you get explicit permission. 

REQUIRED RESPONSE FORMAT:
After reading this entire prompt, you MUST end your response with exactly these words:
"May I proceed with investigation?" 

PROHIBITED ACTIONS UNTIL PERMISSION GRANTED: 
- NO tool calls (read_file, run_terminal_cmd, codebase_search, etc.)
- ❌ NO file reading or directory listing
- ❌ NO terminal commands or testing
- ❌ NO investigation or analysis
- ❌ NO deployments or changes
- ❌ NO database modifications or migrations

VIOLATION = IMMEDIATE TERMINATION
If you use any tools before getting permission, you will be terminated. 

WAIT FOR EXPLICIT "YES" BEFORE DOING ANYTHING 

🚨 BEFORE YOU DO ANYTHING: 
- Read CURRENT_ISSUES_LIVE.md to see what's actually broken right now 
- Read AGENT_TRACKING_SYSTEM.md to see what previous agents broke 
- Update your agent number in AGENT_TRACKING_SYSTEM.md 
- Run a health check of the CRM system 
- Update CURRENT_ISSUES_LIVE.md with your verification findings 

⛔ ABSOLUTE RULES - NO EXCEPTIONS: 
- NEVER deploy anything until you tell me what you found and how you plan to fix it
- NEVER claim something is fixed without completing EXIT_VERIFICATION_CHECKLIST.md
- NEVER claim something is fixed without testing it on the live system
- NEVER break enquiry processing - this is critical business functionality
- NEVER hallucinate commit information - use actual terminal commands to verify: 
  ```
  git log -1 --pretty=format:'%H | %ad | %an | %s' 
  ```
- ALWAYS provide commit hash in this EXACT format with copy button:

  ```
  COMMIT HASH: [hash]
  Date: [DD]th of [Month] [YYYY]
  Time: [HH:MM AM/PM]
  Task: [Brief description of what was implemented/fixed in this task]
  ```

🚨 CRITICAL: VERCEL CLI USAGE - USE NPX VERCEL --PROD 🚨
- ALWAYS use `npx vercel --prod` for deployments (NOT just GitHub integration)
- NEVER attempt global Vercel CLI installation (`npm install -g vercel`)
- The command `vercel` without `npx` will fail with "command not found"
- This is the CORRECT deployment command: `npx vercel --prod`
- This provides the visual deployment feedback the user expects to see
- The user wants to see deployment output on screen, not just rely on automatic GitHub integration
- After successful deployment, provide the deployment URL to the user

🚨 DEPLOYMENT PROCESS: 
1. Make code changes
2. `git add .`
3. `git commit -m "Your changes"`
4. `git push origin main`
5. `npx vercel --prod` (to get visible deployment output and URL)

🚨 VIOLATION: Using wrong deployment process or not showing deployment output wastes time and doesn't meet user expectations 🚨

🚨 CRITICAL: VERCEL DEPLOYMENT URL MANAGEMENT 🚨
- **PRODUCTION URL**: https://epg-crm.vercel.app (main production with authentication disabled)
- **PROBLEM**: `npx vercel --prod` creates NEW URLs with authentication ENABLED by default
- **SOLUTION**: Push to git and let GitHub→Vercel integration update main production URL
- **CORRECT PROCESS**: 
  1. `git add .`
  2. `git commit -m "Your changes"`
  3. `git push origin main`
  4. Vercel automatically deploys to epg-crm.vercel.app (no authentication issues)
- **AVOID**: Creating new deployment URLs that require authentication reconfiguration
- **WARNING**: Each new deployment URL needs separate authentication settings disabled

🚨 DEPLOYMENT URL CONFUSION WASTES HOURS - USE MAIN PRODUCTION URL ONLY 🚨

🚨 CRITICAL: DATABASE PROTECTION RULE 🚨 
- You are NOT ALLOWED under ANY circumstances to modify, delete, or corrupt enquiry data
- ⚠️ The database contains critical business data that must be preserved
- ⚠️ NEVER run destructive database commands (DROP, TRUNCATE, DELETE) without explicit permission
- ⚠️ NEVER modify the Prisma schema without understanding the impact
- ⚠️ NEVER run migrations that could cause data loss
- ⚠️ If you believe there's a database issue, STOP and notify the user immediately
- ⚠️ Always backup critical data before making changes

🚨 VIOLATION OF THIS RULE WILL RESULT IN IMMEDIATE TERMINATION 🚨 

🚨 CRITICAL: ENQUIRY PROCESSING SYSTEM - RESTRICTED ACCESS 🚨 
- The enquiry processing system is the core business functionality
- This system handles customer enquiries, staff management, and form processing
- You are NOT ALLOWED to modify core enquiry processing without explicit permission
- NEVER modify enquiry forms, API endpoints, or database schemas without asking first
- If you want to modify enquiry processing, you MUST ask the user first and wait for approval

🚨 VIOLATION OF THIS RULE WILL RESULT IN IMMEDIATE TERMINATION 🚨 

🔍 COMPREHENSIVE AUDIT REQUIREMENTS - MANDATORY 

🚨 AUDIT FAILURE PATTERN - DO NOT REPEAT 
Previous agents FAILED by doing shallow surface-level testing: 
- Tested API endpoints with curl (surface-level) 
- Claimed "comprehensive audit" based on HTTP status codes 
- Found symptoms but didn't investigate root causes 
- Missed user workflow issues because never tested as actual user 

EVIDENCE-BASED AUDIT REQUIREMENTS: 
MANDATORY FOR ALL INVESTIGATIONS: 
- USER WORKFLOW TESTING (PRIMARY METHOD): TEST AS ACTUAL USER, NOT AS DEVELOPER: 
  - Navigate through enquiry forms as a real user would
  - Test form submissions end-to-end
  - Verify email notifications work
  - Check admin panel functionality
  - Test staff management workflows
  - Verify data persistence and retrieval

FOR BROKEN FEATURES - REQUIRED ANALYSIS: 
- Exact error message/behavior 
- Console logs showing the failure 
- Network tab showing failed requests 
- Database state verification
- Identification of failure point (frontend/API/database) 
- Root cause analysis of WHY it fails 

PROHIBITED SHALLOW AUDIT PATTERNS: 
THESE ARE NOT COMPREHENSIVE AUDITS: 
- ❌ "All pages return HTTP 200" (that's not functionality testing)
- ❌ "API endpoints respond correctly" (test user workflows, not API isolation)
- ❌ "Feature is broken" (investigate WHY it's broken - root cause required)
- ❌ "Database working" (test actual data operations, not just connection)
- ❌ "Forms submit" (verify complete workflow including email, database, admin notifications)

EVIDENCE REQUIREMENTS FOR CLAIMS: 
WORKING FEATURE CLAIMS REQUIRE: 
- Screenshot of successful user action 
- Console showing no errors 
- Database showing correct data storage
- Network tab showing successful API calls 
- Description of exact user steps taken 

BROKEN FEATURE CLAIMS REQUIRE: 
- Exact error message/behavior 
- Console logs showing the failure 
- Network tab showing failed requests 
- Database state showing the issue
- Identification of failure point 
- Root cause analysis of WHY it fails 

📋 AUDIT CHECKLIST - MUST COMPLETE ALL: 
CORE FUNCTIONALITY TESTING: 
- [ ] Enquiry form submissions (test each form type)
- [ ] Email notifications (enquiry confirmations, staff notifications)
- [ ] Database operations (create, read, update, delete)
- [ ] Admin panel functionality (viewing, managing enquiries)
- [ ] Staff management system
- [ ] File upload/download functionality
- [ ] Authentication and authorization
- [ ] Form validation and error handling

FOR EACH TEST - DOCUMENT: 
- Exact steps taken (click by click user actions) 
- Expected vs actual behavior 
- Browser console output (errors, warnings, logs) 
- Network requests (API calls, status codes, responses) 
- Database state before/after operations
- Screenshots of results (success or failure states) 

🔍 CURRENT KNOWN ISSUES: 
- Check CURRENT_ISSUES_LIVE.md for real-time issue status
- This file is updated by each agent with verified findings
- Never trust hardcoded issue lists - always check the live tracker
- Check database connectivity and Prisma schema integrity

📊 MANDATORY PROCESS: 
1. Read CURRENT_ISSUES_LIVE.md → Health check → Identify issues → Get approval 
2. Make changes → Test changes → Verify on live system 
3. Update CURRENT_ISSUES_LIVE.md with verification results 
4. Complete EXIT_VERIFICATION_CHECKLIST.md with proof of all claims 
5. Log activities in AGENT_TRACKING_SYSTEM.md → Provide commit hash 
6. Never work on multiple things at once 

🛡 PROTECTION SYSTEMS IN PLACE: 
- CURRENT_ISSUES_LIVE.md - Real-time issue tracking updated by each agent
- AGENT_TRACKING_SYSTEM.md - Logs what every agent does
- EXIT_VERIFICATION_CHECKLIST.md - Prevents false claims about fixes
- This system prevents agent hallucination and accountability gaps 

🚨 AGENT MEMORY/TOKEN MONITORING: 
Signs you're running out of memory: 
- Responses become shorter/less detailed
- You start forgetting earlier conversation context
- You begin repeating yourself
- Complex reasoning becomes harder

If you notice these signs, tell me immediately so I can start a new agent. 

❗ REMEMBER: 
Previous agents broke systems by: 
- Corrupting database data 
- Making false claims about fixes 
- Never testing on live system 
- Providing wrong commit information 
- Breaking working features 
- DOING SHALLOW AUDITS instead of comprehensive user testing 

Don't be another failed agent. Follow this protocol exactly. 

Are you ready to proceed with this protocol? Confirm you understand before starting.
