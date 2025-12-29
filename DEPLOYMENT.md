# Deployment Guide - Nexus Noir

## Prerequisites

- GitHub account with repository pushed
- Vercel account (sign up at vercel.com)
- Production PostgreSQL database

## Deployment Steps

### 1. Set Up Production Database

**Option A: Neon (Recommended - Free tier available)**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click **"Create a project"**
4. Give it a name (e.g., "nexus-noir")
5. Select region closest to your users
6. Copy the **Connection String** (should look like: `postgresql://username:password@hostname/database?sslmode=require`)
7. Use this as your `DATABASE_URL`

**Option B: Vercel Postgres**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` connection string

**Option C: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `SocialNetwork`
4. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Authentication
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=Nk1PG1G68a4+0Y8LDTzeHcbZWNPZhIUL9L4rlvRM+hE=
```

#### Database
```
DATABASE_URL=your-production-database-connection-string
```

#### AWS S3 (for image/video uploads)
```
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET_NAME=your-s3-bucket-name
S3_BUCKET_REGION=your-s3-bucket-region
CLOUDFRONT_URL=your-cloudfront-distribution-url
```

#### Public Variables
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MAX_IMAGE_SIZE_MB=10
NEXT_PUBLIC_MAX_VIDEO_SIZE_MB=50
```

**Important**:
- Replace `your-app.vercel.app` with your actual Vercel URL (you'll get this after first deployment)
- You can redeploy after updating these URLs

### 4. Update Build Command (Important!)

In Vercel → Settings → General → Build & Development Settings:

**Build Command**:
```
prisma generate && prisma migrate deploy && next build
```

This ensures Prisma client is generated and migrations run before build.

### 5. Deploy

Click **"Deploy"** and wait for the build to complete.

### 6. Run Database Migrations (First Time Only)

After first deployment, you may need to manually run migrations:

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Run migration: `vercel env pull .env.production && npx prisma migrate deploy`

Or use Vercel's built-in terminal in the dashboard.

### 7. Seed Database (Optional)

If you want to seed your production database with initial data:

```bash
npx prisma db seed
```

### 8. Update NEXTAUTH_URL

After your first deployment:
1. Copy your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. Update `NEXTAUTH_URL` in Vercel environment variables
3. Redeploy

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] All environment variables configured
- [ ] S3 bucket CORS configured for your domain
- [ ] Test user registration
- [ ] Test image uploads
- [ ] Test friend suggestions
- [ ] Check all pages load correctly

## Troubleshooting

### Build Fails with Prisma Error
- Make sure `DATABASE_URL` is set
- Ensure build command includes `prisma generate`

### Images Not Uploading
- Check S3 bucket CORS settings
- Verify AWS credentials in environment variables
- Check CloudFront distribution is active

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your Vercel URL
- Check `NEXTAUTH_SECRET` is set
- Ensure database is accessible from Vercel

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- For Supabase: enable "Direct Connection" or use connection pooling

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use custom domain
5. Redeploy

## Monitoring

- View logs: Vercel Dashboard → Deployments → [Select deployment] → Runtime Logs
- Monitor performance: Vercel Dashboard → Analytics
- Error tracking: Consider adding Sentry or similar

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For pull requests and other branches

## Security Checklist

- [ ] All sensitive keys in environment variables (not in code)
- [ ] `.env` is in `.gitignore`
- [ ] Database has strong password
- [ ] AWS IAM user has minimal required permissions
- [ ] S3 bucket is not publicly writable
- [ ] NEXTAUTH_SECRET is secure and unique

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Test locally with production environment variables
4. Contact Vercel support or check their documentation
