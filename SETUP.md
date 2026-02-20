# Nuzul - Setup Guide

## Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ running (via Laragon or standalone)
- Redis installed and running (optional but recommended for caching)

## Installation Steps

### 1. Install Dependencies
```bash
cd d:\laragon\www\projects\amarsaom\ramadan-companion
npm install
```

### 2. Configure Environment
Edit `.env` file with your database credentials:
```bash
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/ramadan_companion"
```

### 3. Create Database
In MySQL, run:
```sql
CREATE DATABASE ramadan_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates all tables in your database.

### 5. Seed Initial Data
```bash
npm run prisma:seed
```

This populates:
- ✅ Bangladesh (country, divisions, districts)
- ✅ 31 Predefined Good Deeds with points

### 6. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Google OAuth Setup (Required for Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret
7. Update `.env`:
   ```bash
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

---

## Project Structure

```
ramadan-companion/ (Nuzul)
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Database migrations
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/
│   │   ├── db/           # Prisma & Redis clients
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── types/            # TypeScript types
│   └── hooks/            # Custom React hooks
├── .env                  # Environment variables
└── package.json
```

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:seed` - Seed database
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create new migration

---

## Next Steps for Development

1. ✅ Database setup (you're here!)
2. 🚧 Create API routes
3. 🚧 Build UI components
4. 🚧 Implement authentication
5. 🚧 Add multilingual support (EN/BN/AR)
6. 🚧 Configure PWA
7. 🚧 Deploy to production

---

## Troubleshooting

### Prisma Client Error
If you see "PrismaClient not found":
```bash
npx prisma generate
```

### Database Connection Error
- Check MySQL is running in Laragon
- Verify DATABASE_URL in `.env`
- Ensure database exists

### Redis Connection Warning
Redis is optional for development. The app will work without it, but without caching.

---

**Status**: Ready for database setup! 
