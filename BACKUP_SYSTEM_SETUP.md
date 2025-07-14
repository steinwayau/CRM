# 🛡️ Backup System Setup Guide

## Overview

This CRM now has a **persistent, database-backed backup system** that prevents data loss and provides reliable recovery options.

## ✅ What's Fixed

### **1. Persistent Backup Storage**
- ❌ **Before**: Backups stored in memory (lost on server restart)
- ✅ **Now**: Backups stored in PostgreSQL database table

### **2. Proper Backup Operations**
- ❌ **Before**: Fake backup operations with no real data
- ✅ **Now**: Real backup/restore functionality with data validation

### **3. Data Protection**
- ❌ **Before**: No confirmation for dangerous operations
- ✅ **Now**: Strong confirmation prompts for restore operations

### **4. Schema Consistency**
- ❌ **Before**: Mixed Prisma/SQL causing data mismatches
- ✅ **Now**: Consistent Prisma-based database operations

### **5. Dangerous Endpoints Removed**
- ❌ **Before**: `/api/init-db` could wipe all data
- ✅ **Now**: Dangerous endpoint completely removed

## 🔧 New Features

### **Backup Management**
- **Manual Backups**: Create on-demand backups
- **Automatic Backups**: Smart frequency-based backups
- **Backup History**: View all backups with metadata
- **Download Backups**: Export backup data as JSON
- **Restore Functionality**: Restore from any backup
- **Backup Cleanup**: Automatically keeps only last 20 backups

### **Data Protection**
- **Pre-restore Backups**: Automatic backup before restore
- **Confirmation Prompts**: Multi-step confirmation for dangerous operations
- **Error Handling**: Proper error messages and recovery

## 📊 Backup Types

### **Automatic Backups**
- **Form Submissions**: Once per hour maximum
- **Enquiry Updates**: Once per 30 minutes maximum
- **Critical Operations**: Always (CSV import, cleanup, etc.)

### **Manual Backups**
- **Admin-triggered**: Via Database Management page
- **API-triggered**: Via `/api/admin/backup` endpoint
- **Automated**: Via cron jobs or scheduled tasks

## 🚀 Setting Up Automated Backups

### **Option 1: Vercel Cron Jobs**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **Option 2: External Cron Service**
Use services like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Example cron job:
```bash
# Daily backup at 2 AM
curl -X PATCH https://your-domain.vercel.app/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"trigger": "Daily automated backup"}'
```

### **Option 3: GitHub Actions**
Create `.github/workflows/backup.yml`:
```yaml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create Backup
        run: |
          curl -X PATCH ${{ secrets.APP_URL }}/api/admin/backup \
            -H "Content-Type: application/json" \
            -d '{"trigger": "GitHub Actions backup"}'
```

## 🔒 Security Recommendations

### **1. API Key Protection**
Add API key verification to backup endpoints:
```typescript
// In backup route
const apiKey = request.headers.get('x-api-key')
if (apiKey !== process.env.BACKUP_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### **2. Environment Variables**
Add to `.env.local`:
```
BACKUP_API_KEY=your-secure-api-key-here
BACKUP_RETENTION_DAYS=30
```

### **3. Access Control**
- Restrict backup endpoints to admin users only
- Log all backup operations
- Monitor backup success/failure rates

## 📱 Usage Guide

### **Creating Backups**
1. **Manual**: Admin Panel → Database Management → "Create Backup Now"
2. **Automatic**: Happens automatically based on activity
3. **API**: `POST /api/admin/backup` with `{"trigger": "description"}`

### **Restoring Backups**
1. Go to Database Management page
2. Find backup in "Backup History"
3. Click "Restore" button
4. Confirm with "RESTORE" text prompt
5. Wait for completion message

### **Downloading Backups**
1. Find backup in "Backup History"
2. Click "Download" button
3. JSON file will download with backup data

### **Monitoring Backups**
- Check "Database Statistics" for backup status
- Review "Backup History" for recent backups
- Monitor backup sizes for anomalies

## 🚨 Emergency Recovery

### **If Data is Lost**
1. **Don't panic** - check backup history first
2. **Find latest backup** in Database Management
3. **Restore immediately** using restore function
4. **Verify data** after restore completes
5. **Create new backup** once verified

### **If Backups are Missing**
1. Check database directly for `backups` table
2. Look for any external backup files
3. Contact system administrator
4. Start fresh data collection if necessary

## 📈 Monitoring & Maintenance

### **Regular Checks**
- ✅ Weekly: Verify backups are being created
- ✅ Monthly: Test restore functionality
- ✅ Quarterly: Review backup retention policy

### **Backup Health Indicators**
- **Good**: Regular backups with consistent sizes
- **Warning**: Sudden size changes or failed backups
- **Critical**: No backups for 24+ hours

### **Troubleshooting**
- **Backup fails**: Check database connection and permissions
- **Restore fails**: Verify backup data integrity
- **Size anomalies**: Check for data corruption or schema changes

## 🔧 Technical Details

### **Database Schema**
```sql
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP DEFAULT NOW(),
  size_kb INTEGER,
  type VARCHAR(20) DEFAULT 'Auto',
  status VARCHAR(20) DEFAULT 'Complete',
  data JSONB,
  enquiry_count INTEGER DEFAULT 0,
  trigger_event VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Backup Data Structure**
```json
{
  "enquiries": [...],
  "staff": [...],
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "trigger": "Manual backup"
}
```

## 📞 Support

For issues with the backup system:
1. Check the Database Management page for error messages
2. Review browser console for technical errors
3. Contact system administrator with specific error details
4. Include backup ID and timestamp when reporting issues

---

**⚠️ Important**: This backup system is now production-ready and will prevent the data loss that occurred previously. Regular monitoring and testing are recommended to ensure continued reliability. 