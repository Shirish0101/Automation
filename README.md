# StarnX Socienty Application

Vercel-ready web application for society maintenance management.

## What Is Included

- Admin login and room-owner login
- PostgreSQL database through Prisma
- Admin dashboard
- Add/edit flat and owner details
- Bulk upload flats by CSV
- Download sample CSV format
- Create multiple admin/owner users
- Link room-owner users to room numbers
- Generate monthly bills
- Add payment entries
- Paid, partial, unpaid tracking
- Owner portal for payment history, pending bills, and outstanding balance
- Audit reports for admin changes
- WhatsApp sharing link
- Excel export
- Modern responsive UI

No flat details are added automatically. The app only seeds:

- One default building
- One admin user

You add all real flats manually or through bulk upload.

## Sample CSV Format

Download from the app:

```text
/templates/flat-upload-template.csv
```

Required columns:

```csv
room_no,owner_name,owner_email,owner_phone,sqft,rate_per_sqft,car_parking_count,car_parking_rate,two_wheeler_count,two_wheeler_rate,water_bill,light_bill,other_charges
101,Sample Owner,sample@example.com,9000000000,750,3.5,1,500,1,150,350,250,0
```

The upload supports common alternate names such as `flat_no`, `room`, `phone`, `mobile`, `rate`, `water`, and `light`.

## Free Hosting Plan

Use:

- GitHub: free source hosting
- Vercel: free web hosting
- Neon, Supabase, Prisma Postgres, or another free Postgres database

Do not use SQLite on Vercel production because Vercel serverless functions do not provide persistent writable local disk.

## Local Setup

Install Node.js first:

```text
https://nodejs.org/
```

Then run:

```powershell
cd C:\Users\10936\Desktop\starnx-society-web
npm install
copy .env.example .env
```

Edit `.env` and set:

```text
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=any-long-random-secret
```

Create database tables:

```powershell
npm run prisma:migrate
npm run seed
npm run dev
```

Open:

```text
http://localhost:3000
```

Default seeded admin:

```text
Email: admin@starnx.local
Password: admin123
```

Change the admin password after first login by creating a new admin user and disabling/removing the default admin in a later admin-management update.

## Deploy To Vercel

1. Create a GitHub repository.
2. Push this folder to GitHub.
3. Create a free Postgres database.
4. In Vercel, import the GitHub repository.
5. Add environment variables:

```text
DATABASE_URL
JWT_SECRET
APP_URL
```

6. Deploy.
7. Run Prisma migration and seed from your local machine or Vercel deployment command:

```powershell
npm run prisma:deploy
npm run seed
```

## Important

I cannot deploy directly from this computer because Node.js, npm, and Git are not installed here, and Vercel/GitHub require your personal login authorization. The project is prepared so you can install Node/Git, push to GitHub, connect it to Vercel, and deploy.
