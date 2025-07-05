# Exclusive Piano Group - CRM System

A modern, Next.js-based customer relationship management system for Exclusive Piano Group enquiry management.

## 🚀 Features

- **Modern Enquiry Form**: Clean, responsive form with all fields from the original PHP system
- **Dashboard**: View, filter, and manage all enquiries with advanced filtering options
- **Database Integration**: PostgreSQL with Prisma ORM for reliable data management
- **Email Notifications**: Automatic email notifications and MailChimp integration
- **Export Functionality**: Export enquiry data to CSV for reporting
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Admin Panel**: IT department features for system management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (planned)
- **Email**: Resend
- **Forms**: React Hook Form + Zod validation
- **Hosting**: Vercel

## 📋 Requirements

- Node.js 18+ and npm
- PostgreSQL database
- Resend account (for email)
- MailChimp account (for marketing integration)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/epg_crm"

# Email
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@epgpianos.com.au"

# MailChimp
MAILCHIMP_API_KEY="your-mailchimp-api-key"
MAILCHIMP_LIST_ID="your-list-id"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Optional: Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
epg-crm/
├── src/
│   ├── app/
│   │   ├── dashboard/          # Dashboard page
│   │   ├── form/              # Enquiry form
│   │   ├── staff-roster/      # Staff management (Phase 2)
│   │   ├── api/               # API endpoints
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and configurations
│   └── prisma/               # Database schema
├── public/                    # Static assets
└── README.md
```

## 🔄 Migration from PHP System

### Database Migration

The current MySQL database structure has been mapped to the new PostgreSQL schema:

- `inbox` table → `enquiries` table with improved field names
- Added proper relationships and constraints
- Preserved all existing data fields
- Enhanced with additional metadata fields

### Form Fields Mapping

All original form fields are preserved:

- Status, Institution Name, Names, Contact Details
- Location (State, Suburb), Nationality
- Product Interests (checkboxes for multiple selection)
- Source tracking and enquiry source
- Comments, Follow-up information
- Customer rating and STEP program
- Staff assignment

## 🎯 Features Roadmap

### Phase 1 (Current) ✅
- [x] Enquiry Form with validation
- [x] Dashboard with filtering
- [x] Basic CRUD operations
- [x] Responsive design
- [x] PostgreSQL integration

### Phase 2 (Next)
- [ ] Staff Roster Management
- [ ] Email notifications setup
- [ ] MailChimp integration
- [ ] CSV export functionality
- [ ] User authentication
- [ ] Role-based access control

### Phase 3 (Future)
- [ ] Advanced reporting and analytics
- [ ] Calendar integration for appointments
- [ ] PDF generation for enquiries
- [ ] Mobile app (React Native)
- [ ] Lead scoring system

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Database Setup on Production

1. Set up PostgreSQL database (recommend PlanetScale or Supabase)
2. Update `DATABASE_URL` in Vercel environment variables
3. Run database migrations

## 📊 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `FROM_EMAIL` | From email address | Yes |
| `MAILCHIMP_API_KEY` | MailChimp API key | Optional |
| `MAILCHIMP_LIST_ID` | MailChimp list ID | Optional |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` format
   - Ensure PostgreSQL is running
   - Check firewall settings

2. **Build Errors**
   - Run `npm run db:generate` before building
   - Clear `.next` folder and rebuild

3. **Email Not Sending**
   - Verify Resend API key
   - Check email configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📞 Support

For technical support or questions:
- Email: support@epgpianos.com.au
- Create an issue in this repository

## 📝 License

This project is proprietary to Exclusive Piano Group.

---

**Built with ❤️ for Exclusive Piano Group by Louie V. - 2025** # Webhook test Sat Jul  5 22:12:11 AEST 2025
# Webhook test Sat Jul  5 22:18:34 AEST 2025
