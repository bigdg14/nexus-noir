# Setup Guide

Complete step-by-step guide to set up and run the Professional Network application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [AWS Services Setup](#aws-services-setup)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Software

- **Redis** (for caching in production) ([Download](https://redis.io/download))
- **Docker** (for containerized PostgreSQL/Redis) ([Download](https://www.docker.com/))

### Required Accounts

- **AWS Account** ([Sign up](https://aws.amazon.com/))
- **Vercel Account** (for deployment, optional) ([Sign up](https://vercel.com/))

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SocialNetwork
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Prisma, PostgreSQL client
- AWS SDK
- NextAuth.js
- UI libraries (Tailwind, shadcn/ui)

### 3. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

You'll fill in the values in later steps.

---

## AWS Services Setup

### Step 1: AWS Cognito (Authentication)

1. **Go to AWS Cognito Console**
   - Navigate to [https://console.aws.amazon.com/cognito](https://console.aws.amazon.com/cognito)
   - Select your region (e.g., us-east-1)

2. **Create User Pool**
   - Click "Create user pool"
   - **Sign-in options**: Email
   - **Password requirements**: Choose your security level
   - **MFA**: Optional (recommended for production)
   - **User account recovery**: Email
   - **Self-service sign-up**: Enable
   - **Attribute verification**: Email
   - Click "Next" through remaining steps

3. **Create App Client**
   - In your User Pool, go to "App integration" tab
   - Click "Create app client"
   - **App client name**: "professional-network-web"
   - **Authentication flows**: ALLOW_USER_PASSWORD_AUTH
   - **Generate client secret**: Yes
   - Click "Create app client"

4. **Get Configuration Values**
   - User Pool ID: Found on Pool overview (e.g., `us-east-1_AbC123DeF`)
   - App Client ID: Found in App client settings
   - App Client Secret: Found in App client settings (click "Show client secret")
   - Region: Your selected region (e.g., `us-east-1`)
   - Issuer: `https://cognito-idp.{region}.amazonaws.com/{user-pool-id}`

5. **Update .env**
   ```env
   COGNITO_USER_POOL_ID="us-east-1_AbC123DeF"
   COGNITO_CLIENT_ID="your-client-id"
   COGNITO_CLIENT_SECRET="your-client-secret"
   COGNITO_REGION="us-east-1"
   COGNITO_ISSUER="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123DeF"
   ```

### Step 2: AWS S3 (Media Storage)

1. **Create S3 Bucket**
   - Go to [S3 Console](https://console.aws.amazon.com/s3)
   - Click "Create bucket"
   - **Bucket name**: `professional-network-media` (must be globally unique)
   - **Region**: Same as Cognito (e.g., us-east-1)
   - **Block Public Access**: Uncheck "Block all public access" (we'll use bucket policy)
   - Click "Create bucket"

2. **Configure CORS**
   - Select your bucket → Permissions tab → CORS
   - Add this configuration:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
       "ExposeHeaders": ["ETag", "x-amz-server-side-encryption", "x-amz-request-id"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Set Bucket Policy** (Optional - for public read access)
   - Permissions tab → Bucket policy
   - Add this policy (replace `YOUR-BUCKET-NAME`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       }
     ]
   }
   ```

4. **Update .env**
   ```env
   S3_BUCKET_NAME="professional-network-media"
   S3_BUCKET_REGION="us-east-1"
   ```

### Step 3: AWS CloudFront (CDN)

1. **Create CloudFront Distribution**
   - Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront)
   - Click "Create distribution"
   - **Origin domain**: Select your S3 bucket
   - **Origin access**: Origin access control settings (recommended)
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Cache policy**: CachingOptimized
   - Click "Create distribution"

2. **Wait for Deployment** (takes 5-15 minutes)

3. **Get Distribution Domain Name**
   - Found in CloudFront console (e.g., `d1234abcd.cloudfront.net`)

4. **Update .env**
   ```env
   CLOUDFRONT_URL="https://d1234abcd.cloudfront.net"
   ```

### Step 4: AWS IAM (Access Keys)

1. **Create IAM User**
   - Go to [IAM Console](https://console.aws.amazon.com/iam)
   - Users → Add users
   - **User name**: `professional-network-app`
   - **Access type**: Programmatic access
   - Click "Next"

2. **Attach Policies**
   - Attach existing policies:
     - `AmazonS3FullAccess` (or create custom policy with limited S3 access)
   - Click through to create user

3. **Save Credentials**
   - **Access Key ID**: Save this
   - **Secret Access Key**: Save this (shown only once!)

4. **Update .env**
   ```env
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
   AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
   ```

---

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**
   - Download and install from [postgresql.org](https://www.postgresql.org/download/)
   - Note the password you set during installation

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE professional_network;

   # Create user (optional)
   CREATE USER pronet_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE professional_network TO pronet_user;

   # Exit
   \q
   ```

3. **Update .env**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/professional_network"
   # Or with custom user:
   # DATABASE_URL="postgresql://pronet_user:your_password@localhost:5432/professional_network"
   ```

### Option 2: AWS RDS PostgreSQL

1. **Create RDS Instance**
   - Go to [RDS Console](https://console.aws.amazon.com/rds)
   - Click "Create database"
   - **Engine**: PostgreSQL
   - **Version**: 14.x or later
   - **Templates**: Free tier (for development) or Production
   - **DB instance identifier**: `professional-network-db`
   - **Master username**: `postgres`
   - **Master password**: Choose a strong password
   - **Instance size**: db.t3.micro (free tier) or larger
   - **Storage**: 20 GB (adjustable)
   - **VPC security group**: Create new or use existing
   - **Public access**: Yes (for development; use VPN/bastion in production)
   - Click "Create database"

2. **Configure Security Group**
   - Select your RDS instance
   - Click on the security group
   - Add inbound rule:
     - **Type**: PostgreSQL
     - **Port**: 5432
     - **Source**: Your IP (for development) or VPC CIDR (for production)

3. **Get Connection String**
   - Endpoint: Found in RDS console (e.g., `db-instance.abc123.us-east-1.rds.amazonaws.com`)

4. **Update .env**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@db-instance.abc123.us-east-1.rds.amazonaws.com:5432/postgres"
   ```

### Option 3: Docker PostgreSQL

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:14
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: professional_network
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

2. **Start Container**
   ```bash
   docker-compose up -d
   ```

3. **Update .env**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/professional_network"
   ```

---

## Running the Application

### 1. Generate Prisma Client

```bash
npm run db:generate
```

This generates the TypeScript types for your database schema.

### 2. Run Database Migrations

```bash
npm run db:migrate
```

This creates all tables in your database based on the Prisma schema.

### 3. Seed Database (Optional)

```bash
npm run db:seed
```

This populates the database with sample users, posts, and interactions for testing.

### 4. Generate NextAuth Secret

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Add to .env:
```env
NEXTAUTH_SECRET="generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Complete .env File

Your final .env should look like:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# AWS Cognito
COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
COGNITO_CLIENT_ID="your-client-id"
COGNITO_CLIENT_SECRET="your-client-secret"
COGNITO_REGION="us-east-1"
COGNITO_ISSUER="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="professional-network-media"
S3_BUCKET_REGION="us-east-1"
CLOUDFRONT_URL="https://d1234abcd.cloudfront.net"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_MAX_IMAGE_SIZE_MB=10
NEXT_PUBLIC_MAX_VIDEO_SIZE_MB=50
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Create Test User

Since we're using AWS Cognito, you'll need to sign up through the Cognito User Pool. Alternatively, you can create a user directly in Cognito:

1. Go to Cognito User Pool → Users tab
2. Click "Create user"
3. Fill in email and temporary password
4. User will need to change password on first login

---

## Troubleshooting

### Database Connection Issues

**Error: Connection refused**
- Ensure PostgreSQL is running: `pg_ctl status` or check Docker container
- Verify DATABASE_URL has correct host, port, username, and password
- Check firewall rules (especially for RDS)

**Error: Database does not exist**
- Create database: `createdb professional_network`
- Or use the psql commands from Database Setup

### Prisma Issues

**Error: Schema parsing failed**
- Check syntax in `prisma/schema.prisma`
- Run `npm run db:generate` to regenerate client

**Error: Migration failed**
- Check database connection
- Try `npm run db:push` for development (skips migration history)
- Reset database: `npx prisma migrate reset` (WARNING: deletes all data)

### AWS Issues

**Error: Invalid S3 credentials**
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check IAM user has S3 permissions
- Ensure credentials are not expired

**Error: CORS error when uploading**
- Check S3 bucket CORS configuration
- Ensure AllowedOrigins includes your domain
- Verify AllowedMethods includes PUT

**Error: Cognito authentication failed**
- Verify COGNITO_CLIENT_ID and COGNITO_CLIENT_SECRET
- Check COGNITO_ISSUER format
- Ensure User Pool is in the same region

### Next.js Issues

**Error: Module not found**
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

**Error: Port 3000 already in use**
- Kill process using port: `lsof -ti:3000 | xargs kill` (macOS/Linux)
- Or use different port: `npm run dev -- -p 3001`

### Common Development Issues

**Images not loading**
- Check S3 bucket permissions
- Verify CloudFront distribution is deployed
- Ensure CLOUDFRONT_URL is correct in .env

**Session not persisting**
- Check NEXTAUTH_SECRET is set
- Clear browser cookies
- Verify database has Session table

**Redis connection failed** (if using Redis)
- Redis is optional for development
- Start Redis: `redis-server` or Docker container
- Comment out REDIS_URL in .env to disable caching

---

## Verifying Setup

### Check Database Connection

```bash
npm run db:studio
```

Opens Prisma Studio - a visual database browser. You should see all tables.

### Check AWS S3 Access

```bash
# Install AWS CLI (optional)
aws s3 ls s3://your-bucket-name --region us-east-1
```

### Run Tests

```bash
npm test
```

All tests should pass if setup is correct.

### Check API Endpoints

Once server is running, visit:
- [http://localhost:3000/api/auth/session](http://localhost:3000/api/auth/session) - Should return session or null

---

## Next Steps

1. **Sign up** for a test account through the UI
2. **Create some posts** to test functionality
3. **Connect with seeded users** if you ran the seed script
4. **Test file uploads** (requires S3 configuration)
5. **Review logs** for any errors

---

## Production Checklist

Before deploying to production:

- [ ] Set strong NEXTAUTH_SECRET
- [ ] Use production database (not local)
- [ ] Enable Redis caching
- [ ] Configure proper CORS origins (not *)
- [ ] Set up S3 bucket policies correctly
- [ ] Enable CloudFront caching
- [ ] Add rate limiting middleware
- [ ] Set up error monitoring (Sentry)
- [ ] Configure environment variables in hosting platform
- [ ] Test all critical user flows
- [ ] Set up database backups
- [ ] Configure SSL/HTTPS
- [ ] Review security best practices

---

For additional help, refer to:
- [README.md](README.md) - Project overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
