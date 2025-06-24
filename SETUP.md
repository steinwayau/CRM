# Quick Setup Guide

## Prerequisites

Before setting up the EPG CRM system, ensure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
3. **Git** - [Download here](https://git-scm.com/)

## Installation Steps

### 1. Install Node.js

If you don't have Node.js installed:

```bash
# On macOS using Homebrew
brew install node

# On Windows, download from nodejs.org
# On Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm
```

### 2. Install Dependencies

```bash
cd epg-crm
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/epg_crm"

# Email
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@epgpianos.com.au"

# MailChimp (Optional)
MAILCHIMP_API_KEY="your-mailchimp-api-key"
MAILCHIMP_LIST_ID="your-list-id"
```

### 4. Set Up Database

```bash
# Install PostgreSQL if not already installed
# Create database
createdb epg_crm

# Generate Prisma client and push schema
npm run db:generate
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick Navigation

- **Home**: `http://localhost:3000` - Overview and navigation
- **Dashboard**: `http://localhost:3000/dashboard` - View all enquiries
- **New Enquiry**: `http://localhost:3000/form` - Submit new enquiry
- **Staff Roster**: `http://localhost:3000/staff-roster` - Manage staff (Phase 2)
- **Admin Panel**: `http://localhost:3000/admin` - IT management features

## Common Issues

### Database Connection Error
- Check if PostgreSQL is running
- Verify DATABASE_URL format in `.env.local`
- Ensure database exists

### Build Errors
- Run `npm run db:generate` if Prisma client is missing
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

### Missing Dependencies
- Run `npm install` to install all dependencies
- Check Node.js version: `node --version` (should be 18+)

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

```env
DATABASE_URL="your-production-postgresql-url"
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@epgpianos.com.au"
MAILCHIMP_API_KEY="your-mailchimp-api-key"
MAILCHIMP_LIST_ID="your-list-id"
```

## Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm run dev  # Test locally
   git commit -am "Add new feature"
   git push origin feature/new-feature
   ```

2. **Database Changes**
   ```bash
   # Modify prisma/schema.prisma
   npm run db:push
   npm run db:generate
   ```

3. **Testing**
   ```bash
   npm run build  # Test production build
   npm run lint   # Check code quality
   ```

## Support

For setup assistance:
- Check this guide first
- Review README.md for detailed information
- Contact: support@epgpianos.com.au

---

**Last Updated: January 2025** 