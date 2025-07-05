# 📧 Email Reminder System Setup Guide

## **🔧 STEP 1: Configure Environment Variables**

### **Required Environment Variables:**

Add these to your Vercel environment variables:

```bash
# Email Service Configuration
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-crm-domain.vercel.app
```

### **How to Set Up Each Variable:**

#### **1. RESEND_API_KEY**
- Go to [Resend.com](https://resend.com)
- Sign in to your account (or create one)
- Navigate to **API Keys** in your dashboard
- Create a new API key with **Send emails** permission
- Copy the key (starts with `re_...`)

#### **2. FROM_EMAIL**
- Use a verified domain email address
- Examples: `noreply@yourdomain.com`, `crm@yourdomain.com`
- Must be a domain you own and have verified in Resend

#### **3. NEXT_PUBLIC_APP_URL**
- Your CRM's production URL
- Example: `https://epg-crm.vercel.app`
- Used for links in reminder emails back to CRM

### **Setting Environment Variables in Vercel:**

1. Go to your Vercel dashboard
2. Select your CRM project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Variable Name: `RESEND_API_KEY`
   - Value: `your_actual_api_key`
   - Environment: **Production, Preview, Development**
5. Click **Save**
6. Repeat for `FROM_EMAIL` and `NEXT_PUBLIC_APP_URL`

---

## **🗄️ STEP 2: Update Database Schema**

### **Method 1: Using API Endpoint (Recommended)**

The system includes an automated database update endpoint:

```bash
# After deploying with environment variables
curl -X POST https://your-crm-domain.vercel.app/api/admin/update-schema
```

**Or using your browser:**
1. Go to: `https://your-crm-domain.vercel.app/api/admin/update-schema`
2. Use a tool like Postman to make a POST request
3. Or use the browser console:

```javascript
fetch('/api/admin/update-schema', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log(data));
```

### **Expected Response:**
```json
{
  "success": true,
  "message": "Database schema updated successfully for reminder system",
  "changes": [
    "Added reminder_sent BOOLEAN column to track if reminder email was sent",
    "Added reminder_sent_at TIMESTAMP column to track when reminder was sent",
    "Added reminder_sent_to VARCHAR(255) column to track which staff member received the reminder"
  ],
  "addedColumns": [
    { "name": "reminder_sent", "type": "boolean", "nullable": "YES" },
    { "name": "reminder_sent_at", "type": "timestamp", "nullable": "YES" },
    { "name": "reminder_sent_to", "type": "character varying", "nullable": "YES" }
  ]
}
```

---

## **🧪 STEP 3: Test the System**

### **Test Email Configuration:**

```bash
# Check configuration
curl https://your-crm-domain.vercel.app/api/admin/test-email

# Test basic email sending
curl -X POST https://your-crm-domain.vercel.app/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "config"}'
```

### **Test Reminder Email:**

```bash
# Send test reminder email
curl -X POST https://your-crm-domain.vercel.app/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "reminder", "testEmail": "your@email.com"}'
```

### **Test Reminder System:**

```bash
# Check for due reminders (manual trigger)
curl https://your-crm-domain.vercel.app/api/reminders/check
```

---

## **🚀 STEP 4: Verify Everything is Working**

### **1. Check Environment Variables**
Visit: `https://your-crm-domain.vercel.app/api/admin/test-email`

Should return:
```json
{
  "emailConfigured": true,
  "hasApiKey": true,
  "hasFromEmail": true,
  "fromEmail": "noreply@yourdomain.com"
}
```

### **2. Test Database Schema**
The reminder system should automatically check for due reminders every hour.

### **3. Create Test Follow-up**
1. Go to any enquiry in your CRM
2. Click "Follow-up" 
3. Set a follow-up time for 1 minute from now
4. Wait for the hourly check or trigger manually

---

## **⚙️ AUTOMATED OPERATION**

Once configured, the system will:

- ✅ **Check every hour** for due reminders (automatic via Vercel cron)
- ✅ **Send professional emails** to assigned staff members
- ✅ **Track sent reminders** to prevent duplicates
- ✅ **Handle errors gracefully** with comprehensive logging

---

## **🔍 TROUBLESHOOTING**

### **Common Issues:**

#### **"Email not configured" Error**
- Check that `RESEND_API_KEY` and `FROM_EMAIL` are set in Vercel
- Verify the API key is valid and has send permissions
- Ensure the FROM_EMAIL domain is verified in Resend

#### **"Database error" Message**
- Make sure you've run the schema update endpoint
- Check that your database connection is working
- Verify the enquiries table exists

#### **No Reminders Being Sent**
- Check that follow-up dates are set in the past (due now)
- Verify staff members exist in the database
- Check the logs in Vercel Functions for any errors

### **Debugging Commands:**

```bash
# Check system status
curl https://your-crm-domain.vercel.app/api/admin/test-email

# Check for due reminders
curl https://your-crm-domain.vercel.app/api/reminders/check

# Manual trigger (for testing)
curl -X POST https://your-crm-domain.vercel.app/api/reminders/check
```

---

## **📊 MONITORING**

### **Vercel Function Logs**
- Go to Vercel Dashboard → Functions
- Check logs for `api/reminders/check`
- Look for successful email sends and any errors

### **Resend Dashboard**
- Monitor sent emails in your Resend dashboard
- Check delivery status and any bounces
- Review email analytics

---

## **🎯 READY FOR PRODUCTION**

Once you complete these steps, your email reminder system will be fully operational!

Staff members will automatically receive professional reminder emails when follow-ups are due, complete with customer information and direct links back to the CRM.

The system runs automatically every hour and requires no manual intervention. 🚀 